from fastapi import FastAPI
from app.database import init_db , engine, Base
from fastapi.middleware.cors import CORSMiddleware
import app.routes.auth as auth
import app.routes.uploads as uploads
import app.routes.reports as reports
from app.routes import admin_stations
from app.routes.compat import router as compat_router
from app.routes import admin_users
from app.routes import departments as departments_routes
from app.routes import shifts


app = FastAPI()

@app.on_event("startup")
def _startup():
    init_db()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


app.include_router(auth.router)       
app.include_router(uploads.router)     
app.include_router(reports.router) 
app.include_router(admin_users.router)
app.include_router(departments_routes.router)
app.include_router(shifts.router)
app.include_router(admin_stations.router)
app.include_router(compat_router, prefix="/api", tags=["compat"], include_in_schema=False)

