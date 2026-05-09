from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os, logging, httpx

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("tutor-ia")

SUPA_URL = os.getenv("SUPABASE_URL")
SUPA_KEY = os.getenv("SUPABASE_ANON_KEY")
SVC_KEY = os.getenv("SUPABASE_SERVICE_KEY")
DB_URL = os.getenv("SUPABASE_DB_URL", "https://nligaklqiywmntufjynh.supabase.co")
DB_KEY = os.getenv("SUPABASE_DB_KEY")
app = FastAPI(title="TutorIA V24")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class Login(BaseModel):
    email: str
    password: str

def dbq(table, select="*", order=None, desc=False, limit=None):
    params = "select=" + select
    if order:
        params += "&order=" + order + (".desc" if desc else ".asc")
    if limit:
        params += "&limit=" + str(limit)
    url = DB_URL + "/rest/v1/" + table + "?" + params
    h = {"apikey": DB_KEY, "Authorization": "Bearer " + DB_KEY}
    r = httpx.get(url, headers=h, timeout=15)
    if r.status_code not in [200, 206]:
        raise Exception("DB " + str(r.status_code) + ": " + r.text)
    return r.json()

async def auth(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token invalido")
    token = authorization.split(" ")[1]
    try:
        svc_h = {"apikey": SVC_KEY, "Authorization": "Bearer " + SVC_KEY, "Accept": "application/json"}
        async with httpx.AsyncClient() as c:
            r = await c.get(SUPA_URL + "/auth/v1/user", headers={"apikey": SUPA_KEY, "Authorization": "Bearer " + token}, timeout=10)
            if r.status_code != 200:
                raise Exception("Invalid token")
            uid = r.json()["id"]
            p = await c.get(SUPA_URL + "/rest/v1/usuarios?select=*&id=eq." + uid, headers=svc_h, timeout=10)
        rows = p.json()
        if not rows:
            raise Exception("User not found")
        return rows[0]
    except Exception:
        raise HTTPException(status_code=401, detail="Nao autorizado")

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}

@app.post("/auth/login")
async def login(req: Login):
    try:
        svc_h = {"apikey": SVC_KEY, "Authorization": "Bearer " + SVC_KEY, "Accept": "application/json", "Content-Type": "application/json"}
        async with httpx.AsyncClient() as c:
            res = await c.post(SUPA_URL + "/auth/v1/token?grant_type=password", headers={"apikey": SUPA_KEY, "Content-Type": "application/json"}, json={"email": req.email, "password": req.password}, timeout=10)
            if res.status_code != 200:
                raise Exception("Auth failed")
            data = res.json()
            uid = data["user"]["id"]
            token = data["access_token"]
            perfil_r = await c.get(SUPA_URL + "/rest/v1/usuarios?select=*&id=eq." + uid, headers=svc_h, timeout=10)
            perfil_rows = perfil_r.json()
            perfil = perfil_rows[0] if perfil_rows else {}
            try:
                await c.post(SUPA_URL + "/rest/v1/log_acessos", headers=svc_h, json={"usuario_id": uid, "ip": "web", "acao": "login"}, timeout=10)
            except Exception:
                pass
        return {"access_token": token, "usuario": perfil}
    except Exception as e:
        log.error("Login: " + str(e))
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

@app.get("/me")
async def me(user=Depends(auth)):
    return user

@app.get("/dashboard/resumo")
async def resumo(user=Depends(auth)):
    try:
        fin = dbq("financeiro_lancamentos", "valor")
        saldo = sum(r["valor"] for r in fin) if fin else 0
        obras = dbq("obras", "valor_total")
        valor_obras = sum(r.get("valor_total") or 0 for r in obras)
        leit = dbq("biblia_leituras", "id")
        ult = dbq("financeiro_lancamentos", "data_competencia,descricao,valor,categoria", "data_competencia", True, 5)
        uleit = dbq("biblia_leituras", "data_leitura,livro,referencia,frase_reflexiva", "data_leitura", True, 3)
        return {"financeiro": {"saldo": round(saldo, 2), "total_lancamentos": len(fin), "ultimos": ult}, "obras": {"total": len(obras), "valor_total": round(valor_obras, 2)}, "leituras": {"total": len(leit), "ultimas": uleit}, "clientes": {"total": 19}}
    except Exception as e:
        log.error("Resumo: " + str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/financeiro/lancamentos")
async def lancamentos(limite: int = 50, pagina: int = 0, user=Depends(auth)):
    try:
        r = dbq("financeiro_lancamentos", "data_competencia,descricao,valor,categoria,natureza", "data_competencia", True, limite)
        return {"lancamentos": r, "total": len(r)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/financeiro/resumo-mensal")
async def mensal(user=Depends(auth)):
    try:
        r = dbq("financeiro_lancamentos", "data_competencia,valor", "data_competencia", True, 1000)
        meses = {}
        for x in r:
            m = x["data_competencia"][:7]
            if m not in meses:
                meses[m] = {"mes": m, "entradas": 0, "saidas": 0}
            if x["valor"] > 0:
                meses[m]["entradas"] += x["valor"]
            else:
                meses[m]["saidas"] += abs(x["valor"])
        return {"meses": sorted(meses.values(), key=lambda x: x["mes"], reverse=True)[:12]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/obras")
async def obras(user=Depends(auth)):
    try:
        r = dbq("obras", "*", "valor_total", True)
        return {"obras": r, "total": len(r)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/leituras")
async def leituras(limite: int = 30, user=Depends(auth)):
    try:
        r = dbq("biblia_leituras", "*", "data_leitura", True, limite)
        return {"leituras": r, "total": len(r)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
