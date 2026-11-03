# 🩺 Prompt Doctor — AI-Powered Prompt Optimizer

**Prompt Doctor** is an AI-powered web application that analyzes, evaluates, and improves user prompts using Google's Gemini AI.

It identifies weaknesses in prompts, assigns a quality score, and generates optimized versions to help users get better results from AI tools.

## 🚀 Features

- **AI Prompt Analysis:** Evaluates prompts using Google Gemini.
- **Prompt Quality Score:** Rates prompt quality out of 100.
- **Weakness Detection:** Identifies missing context, unclear objectives, and formatting issues.
- **Prompt Optimization:** Generates clearer and more effective prompts.
- **Multiple Modes:** Supports Professional, Academic, and Creative optimization.
- **Copy Optimized Prompt:** Easily copy the improved result.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite |
| Backend | Python, FastAPI |
| AI Engine | Google Gemini API |
| Data Validation | Pydantic |
| API Testing | Swagger UI |
| Version Control | Git, GitHub |


## 📁 Project Structure

```text
prompt-doctor/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/kgb1802/Prompt-Doctor.git
cd Prompt-Doctor
```

### 2. Set up the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file inside the backend directory:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

Backend API: `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## 🔍 How It Works

1. User enters a prompt.
2. User selects an optimization mode.
3. React sends the prompt to the FastAPI backend.
4. FastAPI processes the request using Google Gemini.
5. Gemini evaluates the prompt and generates an optimized version.
6. The dashboard displays the quality score, weaknesses, and improved prompt.

## 🔐 Security

- API keys are stored in environment variables.
- `.env` files are excluded using `.gitignore`.
- API credentials are never exposed in frontend code.

## 🔮 Future Enhancements

- MongoDB integration for prompt history.
- User authentication and personalized dashboards.
- Before-and-after prompt comparison.
- Advanced prompt analytics.
- Cloud deployment.

## 👨‍💻 Author

**KGB**

GitHub: [@kgb1802](https://github.com/kgb1802)

---

*Built to make AI work smarter.*
