# TutorIA Web V24 — Backend FastAPI
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
import os, logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("tutor-ia")

SUPA_URL = os.getenv("SUPABASE_URL")
SUPA_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
DB_URL = os.getenv("SUPABASE_DB_URL", "https://nligaklqiywmntufjynh.supabase.co")
DB_KEY = os.getenv("SUPABASE_DB_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPA_URL, SUPA_KEY)
db: Client = create_client(DB_URL, DB_KEY)

app = FastAPI(title="TutorIA API V24")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("ALLOWED_ORIGINS","http://localhost:5173").split(","), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class LoginRequest(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    mensagem: str
    historico: list = []

async def get_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token invalido")
    token = authorization.split(" ")[1]
    try:
        user = supabase.auth.get_user(token)
        uid = user.user.id
        perfil = supabase.table("usuarios").select("*").eq("id", uid).single().execute()
        return perfil.data
    except:
        raise HTTPException(status_code=401, detail="Nao autorizado")

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0", "sistema": "TutorIA V24"}

@app.post("/auth/login")
async def login(req: LoginRequest):
    try:
        res = supabase.auth.sign_in_with_password({"email": req.email, "password": req.password})
        uid = res.user.id
        perfil = supabase.table("usuarios").select("*, permissoes(modulo_slug, nivel)").eq("id", uid).single().execute()
        try:
            supabase.table("log_acessos").insert({"usuario_id": uid, "ip": "web", "acao": "login"}).execute()
        except:
            pass
        return {"access_token": res.session.access_token, "usuario": perfil.data}
    except Exception as e:
        log.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

@app.get("/me")
async def me(user=Depends(get_user)):
    return user

@app.get("/dashboard/resumo")
async def dashboard_resumo(user=Depends(get_user)):
    try:
        fin = db.table("financeiro_lancamentos").select("valor").execute()
        saldo = sum(r["valor"] for r in fin.data) if fin.data else 0
        obras = db.table("obras").select("valor_total").execute()
        valor_obras = sum(r.get("valor_total") or 0 for r in obras.data)
        leit = db.table("biblia_leituras").select("id").execute()
        ult_lanc = db.table("financeiro_lancamentos").select("data_competencia,descricao,valor,categoria").order("data_competencia",desc=True).limit(5).execute()
        ult_leit = db.table("biblia_leituras").select("data_leitura,livro,referencia,frase_reflexiva").order("data_leitura",desc=True).limit(3).execute()
        return {"financeiro":{"saldo":round(saldo,2),"total_lancamentos":len(fin.data),"ultimos":ult_lanc.data},"obras":{"total":len(obras.data),"valor_total":round(valor_obras,2)},"leituras":{"total":len(leit.data),"ultimas":ult_leit.data},"clientes":{"total":19}}
    except Exception as e:
        log.error(f"Dashboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/financeiro/lancamentos")
async def financeiro_lancamentos(limite: int = 50, pagina: int = 0, user=Depends(get_user)):
    try:
        result = db.table("financeiro_lancamentos").select("data_competencia,descricao,valor,categoria,natureza").order("data_competencia",desc=True).range(pagina*limite,(pagina+1)*limite-1).execute()
        return {"lancamentos": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/financeiro/resumo-mensal")
async def financeiro_mensal(user=Depends(get_user)):
    try:
        lancamentos = db.table("financeiro_lancamentos").select("data_competencia,valor").order("data_competencia",desc=True).limit(1000).execute()
        meses = {}
        for r in lancamentos.data:
            mes = r["data_competencia"][:7]
            if mes not in meses:
                meses[mes] = {"mes":mes,"entradas":0,"saidas":0}
            if r["valor"] > 0:
                meses[mes]["entradas"] += r["valor"]
            else:
                meses[mes]["saidas"] += abs(r["valor"])
        return {"meses": sorted(meses.values(), key=lambda x: x["mes"], reverse=True)[:12]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/obras")
async def listar_obras(user=Depends(get_user)):
    try:
        result = db.table("obras").select("*").order("valor_total",desc=True).execute()
        return {"obras": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/leituras")
async def listar_leituras(limite: int = 30, user=Depends(get_user)):
    try:
        result = db.table("biblia_leituras").select("*").order("data_leitura",desc=True).limit(limite).execute()
        return {"leituras": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(req: ChatRequest, user=Depends(get_user)):
    try:
        import httpx
        ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")
        fin = db.table("financeiro_lancamentos").select("valor").execute()
        saldo = round(sum(r["valor"] for r in fin.data), 2) if fin.data else 0
        obras = db.table("obras").select("id").execute()
        leit = db.table("biblia_leituras").select("id").execute()
        contexto = f"Voce e o assistente do TutorIA, sistema de gestao de {user.get(chr(110)+chr(111)+chr(109)+chr(101))}. Saldo: R${saldo:,.2f}. Obras: {len(obras.data)}. Leituras: {len(leit.data)}. Responda em portugues."
        historico = [{"role":m["role"],"content":m["content"]} for m in req.historico[-6:]]
        historico.append({"role":"user","content":req.mensagem})
        async with httpx.AsyncClient() as client:
            res = await client.post("https://api.anthropic.com/v1/messages",headers={"x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},json={"model":"claude-haiku-4-5-20251001","max_tokens":1024,"system":contexto,"messages":historico},timeout=30)
            data = res.json()
            resposta = data["content"][0]["text"] if data.get("content") else "Erro na resposta."
        return {"resposta": resposta}
    except Exception as e:
        log.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
