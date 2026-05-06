# TutorIA V24
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
import os, logging, httpx

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("tutor-ia")

SUPA_URL = os.getenv("SUPABASE_URL")
SUPA_KEY = os.getenv("SUPABASE_ANON_KEY")
DB_URL = os.getenv("SUPABASE_DB_URL", "https://nligaklqiywmntufjynh.supabase.co")
DB_KEY = os.getenv("SUPABASE_DB_KEY")

supabase: Client = create_client(SUPA_URL, SUPA_KEY)
db: Client = create_client(DB_URL, DB_KEY)

app = FastAPI(title="TutorIA V24")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("ALLOWED_ORIGINS","http://localhost:5173").split(","), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class Login(BaseModel):
    email: str
    password: str

class Chat(BaseModel):
    mensagem: str
    historico: list = []

async def auth(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token invalido")
    token = authorization.split(" ")[1]
    try:
        svc: Client = create_client(SUPA_URL, os.getenv("SUPABASE_SERVICE_KEY"))
        u = svc.auth.get_user(token)
        p = svc.table("usuarios").select("*").eq("id", u.user.id).single().execute()
        return p.data
    except:
        raise HTTPException(401, "Nao autorizado")

@app.get("/health")
def health(): return {"status":"ok","version":"2.0.0","sistema":"TutorIA V24"}

@app.post("/auth/login")
async def login(req: Login):
    try:
        async with httpx.AsyncClient() as c:
            res = await c.post(f"{SUPA_URL}/auth/v1/token?grant_type=password",headers={"apikey":SUPA_KEY,"Content-Type":"application/json"},json={"email":req.email,"password":req.password},timeout=10)
        if res.status_code != 200:
            raise Exception(f"Auth failed: {res.text}")
        data = res.json()
        uid = data["user"]["id"]
        token = data["access_token"]
        svc: Client = create_client(SUPA_URL, os.getenv("SUPABASE_SERVICE_KEY"))
        perfil = svc.table("usuarios").select("*,permissoes(modulo_slug,nivel)").eq("id",uid).single().execute()
        try: supabase.table("log_acessos").insert({"usuario_id":uid,"ip":"web","acao":"login"}).execute()
        except: pass
        return {"access_token":token,"usuario":perfil.data}
    except Exception as e:
        log.error(f"Login error: {e}")
        raise HTTPException(401, "Email ou senha incorretos")

@app.get("/me")
async def me(user=Depends(auth)): return user

@app.get("/dashboard/resumo")
async def resumo(user=Depends(auth)):
    try:
        fin = db.table("financeiro_lancamentos").select("valor").execute()
        saldo = sum(r["valor"] for r in fin.data) if fin.data else 0
        obras = db.table("obras").select("valor_total").execute()
        valor_obras = sum(r.get("valor_total") or 0 for r in obras.data)
        leit = db.table("biblia_leituras").select("id").execute()
        ult = db.table("financeiro_lancamentos").select("data_competencia,descricao,valor,categoria").order("data_competencia",desc=True).limit(5).execute()
        uleit = db.table("biblia_leituras").select("data_leitura,livro,referencia,frase_reflexiva").order("data_leitura",desc=True).limit(3).execute()
        return {"financeiro":{"saldo":round(saldo,2),"total_lancamentos":len(fin.data),"ultimos":ult.data},"obras":{"total":len(obras.data),"valor_total":round(valor_obras,2)},"leituras":{"total":len(leit.data),"ultimas":uleit.data},"clientes":{"total":19}}
    except Exception as e:
        log.error(f"Resumo error: {e}")
        raise HTTPException(500, str(e))

@app.get("/financeiro/lancamentos")
async def lancamentos(limite:int=50, pagina:int=0, user=Depends(auth)):
    try:
        r = db.table("financeiro_lancamentos").select("data_competencia,descricao,valor,categoria,natureza").order("data_competencia",desc=True).range(pagina*limite,(pagina+1)*limite-1).execute()
        return {"lancamentos":r.data,"total":len(r.data)}
    except Exception as e: raise HTTPException(500, str(e))

@app.get("/financeiro/resumo-mensal")
async def mensal(user=Depends(auth)):
    try:
        r = db.table("financeiro_lancamentos").select("data_competencia,valor").order("data_competencia",desc=True).limit(1000).execute()
        meses = {}
        for x in r.data:
            m = x["data_competencia"][:7]
            if m not in meses: meses[m]={"mes":m,"entradas":0,"saidas":0}
            if x["valor"]>0: meses[m]["entradas"]+=x["valor"]
            else: meses[m]["saidas"]+=abs(x["valor"])
        return {"meses":sorted(meses.values(),key=lambda x:x["mes"],reverse=True)[:12]}
    except Exception as e: raise HTTPException(500, str(e))

@app.get("/obras")
async def obras(user=Depends(auth)):
    try:
        r = db.table("obras").select("*").order("valor_total",desc=True).execute()
        return {"obras":r.data,"total":len(r.data)}
    except Exception as e: raise HTTPException(500, str(e))

@app.get("/leituras")
async def leituras(limite:int=30, user=Depends(auth)):
    try:
        r = db.table("biblia_leituras").select("*").order("data_leitura",desc=True).limit(limite).execute()
        return {"leituras":r.data,"total":len(r.data)}
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/chat")
async def chat(req: Chat, user=Depends(auth)):
    try:
        KEY = os.getenv("ANTHROPIC_API_KEY")
        fin = db.table("financeiro_lancamentos").select("valor").execute()
        saldo = round(sum(r["valor"] for r in fin.data),2) if fin.data else 0
        obras = db.table("obras").select("id").execute()
        leit = db.table("biblia_leituras").select("id").execute()
        nome = user.get("nome","Fabiano")
        ctx = f"Voce e assistente do TutorIA de {nome}. Saldo: R${saldo:,.2f}. Obras: {len(obras.data)}. Leituras: {len(leit.data)}. Responda em portugues."
        hist = [{"role":m["role"],"content":m["content"]} for m in req.historico[-6:]]
        hist.append({"role":"user","content":req.mensagem})
        async with httpx.AsyncClient() as c:
            res = await c.post("https://api.anthropic.com/v1/messages",headers={"x-api-key":KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},json={"model":"claude-haiku-4-5-20251001","max_tokens":1024,"system":ctx,"messages":hist},timeout=30)
            data = res.json()
        return {"resposta":data["content"][0]["text"] if data.get("content") else "Erro."}
    except Exception as e:
        log.error(f"Chat error: {e}")
        raise HTTPException(500, str(e))
