import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import Layout from "./components/Layout";
import {
  DEFAULT_INTERVENTIONS,
  DEFAULT_PC,
  DEFAULT_PROFILE,
} from "./data/mockData";
import HomePage from "./routes/homepage";
import LoginPage from "./routes/loginpage";
import SignInPage from "./routes/signInpage";
import InterventionPage from "./routes/interventionpage";
import HistoryPage from "./routes/historypage";
import AddPcPage from "./routes/addpcpage";
import RegisterInterventionPage from "./routes/registerinterventionpage";
import PcInfoPage from "./routes/pcinfopage";
import { toInterventionDetail } from "./utils/intervention";

function InterventionRoute() {
  const navigate = useNavigate();
  const { id } = useParams();
  const item =
    DEFAULT_INTERVENTIONS.find((intervention) => intervention.id === id) ??
    DEFAULT_INTERVENTIONS[0];
  return (
    <InterventionPage
      intervention={toInterventionDetail(item)}
      onBack={() => navigate("/home")}
    />
  );
}

function PcRoute() {
  const navigate = useNavigate();
  const { equipmentId = DEFAULT_PC.equipmentId } = useParams();
  const interventions = DEFAULT_INTERVENTIONS.filter(
    (item) => item.equipmentId === equipmentId,
  ).map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    classId: item.classId,
    description: item.description,
    technician: item.technician,
    timestamp: item.timestamp,
    date: "2026-09-17",
    previousValue: item.id === "INT-4821" ? "8 Go" : undefined,
    newValue: item.id === "INT-4821" ? "16 Go" : undefined,
  }));

  return (
    <PcInfoPage
      pc={{ ...DEFAULT_PC, equipmentId }}
      interventions={interventions}
      onBack={() => navigate("/home")}
      onOpenIntervention={(id) => navigate(`/intervention/${id}`)}
    />
  );
}

function HistoryRoute() {
  const navigate = useNavigate();
  return (
    <HistoryPage
      interventions={DEFAULT_INTERVENTIONS}
      onBack={() => navigate("/home")}
      onOpenIntervention={(id) => navigate(`/intervention/${id}`)}
    />
  );
}

function NewInterventionRoute() {
  const navigate = useNavigate();
  return (
    <RegisterInterventionPage
      onCancel={() => navigate("/home")}
      onSubmit={() => navigate("/home")}
    />
  );
}

function NewPcRoute() {
  const navigate = useNavigate();
  return (
    <AddPcPage
      onCancel={() => navigate("/home")}
      onSubmit={() => navigate("/home")}
    />
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route element={<Layout profile={DEFAULT_PROFILE} />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/history" element={<HistoryRoute />} />
        <Route path="/intervention/new" element={<NewInterventionRoute />} />
        <Route path="/pc/new" element={<NewPcRoute />} />
        <Route path="/intervention/:id" element={<InterventionRoute />} />
        <Route path="/pc/:equipmentId" element={<PcRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
