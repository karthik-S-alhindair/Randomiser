🎲 Randomiser
📌 Purpose
Randomiser is a desktop application designed to enforce regulatory compliance by randomly selecting employees from uploaded department-wise data for breath analyzer testing. The app processes an uploaded .xlsx file containing employee details, segregates them by department, and picks 2–3 employees per department each time.

It uses a React + Vite frontend compiled into a native .exe via Tauri, and a FastAPI backend built with Python.

🗂️ Project Structure
📁 backend/ — Python (FastAPI)
Handles all backend logic like file processing, employee selection, and API serving.

bash

backend/
├── app/
│   ├── __pycache__/                  # Cached bytecode files
│   ├── database.py                  # Database logic or Excel parsing setup
│   ├── main.py                      # FastAPI entrypoint — includes /ping & router inclusion
│   ├── models.py                    # Pydantic schemas (e.g., Employee)
│   └── routes/
│       ├── __pycache__/
│       └── staff.py                # Staff-related endpoints (e.g., upload, randomize)
├── venv/                            # Python virtual environment
│   ├── Include/
│   ├── Lib/
│   ├── Scripts/
│   └── pyvenv.cfg
├── requirements.txt                 # Python dependency list
📁 frontend/ — React + Vite + Tauri
The frontend interacts with the backend APIs and offers a clean, interactive desktop UI.

perl


frontend/
├── node_modules/                    # Node dependencies (auto-generated)
├── public/
│   └── vite.svg                     # Default Vite asset
├── src/
│   ├── api/
│   │   └── axios.js                 # Axios setup for API calls
│   ├── assets/
│   │   └── react.svg                # Static SVG asset
│   ├── components/
│   │   ├── PieChart.jsx            # (Optional) Pie chart for analytics
│   │   ├── StatCard.jsx            # Statistics card for summaries
│   │   └── UploadForm.jsx          # Upload form for `.xlsx` staff data
│   ├── pages/
│   │   └── Dashboard.jsx           # Central dashboard layout
│   ├── App.css                     # App styling
│   ├── App.jsx                     # Root component with `/ping` test logic
│   ├── index.css                   # Global styles
│   └── main.jsx                    # Entry point (ReactDOM)
├── src-tauri/                       # Tauri-specific config and Rust code
├── package.json                    # npm scripts and metadata
├── vite.config.js                  # Vite build configuration
├── README.md
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
🔗 System Architecture
text


Frontend (React + Vite + Tauri)
    |
    |  axios.get("/ping")         -->   FastAPI /ping --> "pong from backend"
    |  axios.post("/upload")      -->   /staff/upload --> Handles file upload
    |  axios.get("/random")       -->   /staff/random --> Returns randomly picked staff
    ↓
  Native Windows Executable (.exe) via Tauri
⚙️ Key Features
✅ Ping Check — Confirms backend connection (/ping endpoint)

📤 Excel Upload — Accepts .xlsx files with employee records

🔀 Random Selection — Picks 2–3 employees per department

🖥️ Executable App — Runs as a native .exe via Tauri

📊 Componentized UI — Upload form, statistics card, chart components for future

🔧 Technology Stack
Layer	Tool/Library
Frontend	React, Vite
Backend	FastAPI (Python 3.13)
API Requests	Axios
Build System	Tauri (Rust)
Data Format	Excel (.xlsx)
Styling	CSS

🚀 Development Commands
📦 Backend
bash

cd backend
uvicorn app.main:app --reload
💻 Frontend (Dev Mode)
bash

cd frontend
npm run dev
🛠️ Tauri Dev (App Preview)
bash

npm run tauri dev
📦 Build Production .exe
bash

npm run build
npx tauri build