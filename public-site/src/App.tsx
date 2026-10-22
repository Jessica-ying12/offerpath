import { HashRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { StoreProvider } from "./lib/store";
import { HomePage } from "./pages/HomePage";
import { RoadmapIndexPage, RoadmapDetailPage } from "./pages/RoadmapPage";
import { PlanPage } from "./pages/PlanPage";
import { DocsPage } from "./pages/DocsPage";
import { DocPage } from "./pages/DocPage";
import { QaIndexPage } from "./pages/QaIndexPage";
import { QaBankPage } from "./pages/QaBankPage";
import { QaSessionPage } from "./pages/QaSessionPage";
import { BankPage } from "./pages/BankPage";
import { ReviewPage } from "./pages/ReviewPage";
import { ProgressPage } from "./pages/ProgressPage";
import { MorePage } from "./pages/MorePage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/roadmap" element={<RoadmapIndexPage />} />
            <Route path="/roadmap/:roadmapId" element={<RoadmapDetailPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/doc/:docId" element={<DocPage />} />
            <Route path="/qa" element={<QaIndexPage />} />
            <Route path="/qa/:docId" element={<QaBankPage />} />
            <Route path="/qa/:docId/session" element={<QaSessionPage />} />
            <Route path="/quiz" element={<BankPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/more" element={<MorePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </StoreProvider>
  );
}
