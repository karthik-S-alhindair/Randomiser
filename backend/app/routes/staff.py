from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_all_staff():
    return {"message": "Staff list will appear here"}
