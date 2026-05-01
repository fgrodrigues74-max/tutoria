# ============================================================
# TutorIA Web V24 — Backend FastAPI
# ============================================================
# Instalar: pip install fastapi uvicorn python-dotenv supabase pydantic
# Rodar:    uvicorn main:app --reload --port 8000
# ============================================================

from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from dotenv import load_dotenv
import os, logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("tutor-ia")

# ── Supabase ────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")   # service_role (backend apenas!)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── App ─────────────────────────────────────────────────────
app = FastAPI(title="TutorIA API", version="1.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ─────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    usuario: dict

class RefreshRequest(BaseModel):
    refresh_token: str

class CriarUsuarioRequest(BaseModel):
    nome: str
    email: EmailStr
    password: str
    role: str = "operador"
    telefone: str | None = None

class PermissaoRequest(BaseModel):
    usuario_id: str
    modulo_slug: str
    nivel: str = "leitura"

# ── Dependência de autenticação ──────────────────────────────
async def get_current_user(request: Request) -> dict:
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Token não informado")
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Token inválido")
        # Buscar perfil completo
        perfil = supabase.table("usuarios").select("*").eq("id", user.user.id).single().execute()
        if not perfil.data or not perfil.data.get("ativo"):
            raise HTTPException(status_code=403, detail="Usuário inativo")
        return perfil.data
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Falha na autenticação")

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return current_user

# ── ROTAS DE AUTENTICAÇÃO ────────────────────────────────────

@app.post("/auth/login", response_model=LoginResponse, tags=["Auth"])
async def login(data: LoginRequest, request: Request):
    """Login com email e senha. Retorna JWT + refresh token."""
    try:
        res = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
        if not res.session:
            raise HTTPException(status_code=401, detail="Email ou senha incorretos")

        # Buscar perfil e permissões
        uid = res.user.id
        perfil = supabase.table("usuarios").select("*, permissoes(modulo_slug, nivel)") \
                         .eq("id", uid).single().execute()

        # Log de acesso
        supabase.table("log_acessos").insert({
            "usuario_id": uid,
            "acao": "login",
            "ip": request.client.host,
            "user_agent": request.headers.get("user-agent", "")[:200]
        }).execute()

        return {
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "usuario": perfil.data
        }
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Falha no login")

@app.post("/auth/refresh", tags=["Auth"])
async def refresh(data: RefreshRequest):
    """Renova o access_token usando o refresh_token."""
    try:
        res = supabase.auth.refresh_session(data.refresh_token)
        if not res.session:
            raise HTTPException(status_code=401, detail="Refresh token inválido")
        return {
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Refresh falhou")

@app.post("/auth/logout", tags=["Auth"])
async def logout(current_user: dict = Depends(get_current_user)):
    supabase.auth.sign_out()
    return {"ok": True}

# ── ROTAS DE USUÁRIO ─────────────────────────────────────────

@app.get("/me", tags=["Usuário"])
async def me(current_user: dict = Depends(get_current_user)):
    """Retorna o perfil e permissões do usuário logado."""
    perms = supabase.table("permissoes").select("modulo_slug, nivel") \
                    .eq("usuario_id", current_user["id"]).execute()
    return {**current_user, "permissoes": perms.data}

@app.get("/admin/usuarios", tags=["Admin"])
async def listar_usuarios(admin: dict = Depends(require_admin)):
    """Lista todos os usuários com permissões. Apenas admin."""
    res = supabase.table("usuarios") \
                  .select("*, permissoes(modulo_slug, nivel)") \
                  .order("nome").execute()
    return res.data

@app.post("/admin/usuarios", tags=["Admin"])
async def criar_usuario(data: CriarUsuarioRequest, admin: dict = Depends(require_admin)):
    """Cria novo usuário. Apenas admin."""
    try:
        # Criar na auth do Supabase
        auth_res = supabase.auth.admin.create_user({
            "email": data.email,
            "password": data.password,
            "email_confirm": True
        })
        uid = auth_res.user.id

        # Inserir perfil
        supabase.table("usuarios").insert({
            "id": uid,
            "nome": data.nome,
            "email": data.email,
            "role": data.role,
            "telefone": data.telefone
        }).execute()

        return {"ok": True, "id": uid}
    except Exception as e:
        log.error(f"Criar usuário: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/admin/usuarios/{uid}", tags=["Admin"])
async def atualizar_usuario(uid: str, data: dict, admin: dict = Depends(require_admin)):
    """Atualiza dados de um usuário."""
    allowed = {"nome", "role", "telefone", "ativo"}
    payload = {k: v for k, v in data.items() if k in allowed}
    supabase.table("usuarios").update(payload).eq("id", uid).execute()
    return {"ok": True}

# ── ROTAS DE PERMISSÕES ──────────────────────────────────────

@app.post("/admin/permissoes", tags=["Admin"])
async def conceder_permissao(data: PermissaoRequest, admin: dict = Depends(require_admin)):
    """Concede ou atualiza permissão de um usuário em um módulo."""
    supabase.table("permissoes").upsert({
        "usuario_id": data.usuario_id,
        "modulo_slug": data.modulo_slug,
        "nivel": data.nivel
    }, on_conflict="usuario_id,modulo_slug").execute()
    return {"ok": True}

@app.delete("/admin/permissoes/{uid}/{slug}", tags=["Admin"])
async def revogar_permissao(uid: str, slug: str, admin: dict = Depends(require_admin)):
    """Revoga permissão de um usuário em um módulo."""
    supabase.table("permissoes").delete() \
            .eq("usuario_id", uid).eq("modulo_slug", slug).execute()
    return {"ok": True}

# ── ROTAS DE MÓDULOS ─────────────────────────────────────────

@app.get("/modulos", tags=["Módulos"])
async def listar_modulos(current_user: dict = Depends(get_current_user)):
    """Lista módulos disponíveis para o usuário logado."""
    todos = supabase.table("modulos").select("*").eq("ativo", True).order("ordem").execute()
    if current_user["role"] == "admin":
        return todos.data
    # Filtrar pelos módulos com permissão
    perms = supabase.table("permissoes").select("modulo_slug") \
                    .eq("usuario_id", current_user["id"]).execute()
    slugs_permitidos = {p["modulo_slug"] for p in perms.data}
    return [m for m in todos.data if m["slug"] in slugs_permitidos]

# ── ROTAS DE LOG ─────────────────────────────────────────────

@app.get("/admin/logs", tags=["Admin"])
async def listar_logs(limit: int = 100, admin: dict = Depends(require_admin)):
    res = supabase.table("log_acessos").select("*, usuarios(nome, email)") \
                  .order("created_at", desc=True).limit(limit).execute()
    return res.data

# ── HEALTH CHECK ─────────────────────────────────────────────

@app.get("/health", tags=["Sistema"])
async def health():
    return {"status": "ok", "version": "1.0.0", "sistema": "TutorIA V24"}

# ── MAIN ─────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
