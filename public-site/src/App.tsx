import { HashRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { StoreProvider } from "./lib/store";
import { HomePage } from "./pages/HomePage";
import { PlanPage } from "./pages/PlanPage";
import { DocsPage } from "./pages/DocsPage";
import { DocPage } from "./pages/DocPage";
import { QaIndexPage } from "./pages/QaIndexPage";
import { QaBankPage } from "./pages/QaBankPage";
import { QaSessionPage } from "./pages/QaSessionPage";
import { QuizPage } from "./pages/QuizPage";
import { ReviewPage } from "./pages/ReviewPage";
import { ProgressPage } from "./pages/ProgressPage";
import { MorePage } from "./pages/MorePage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/doc/:docId" element={<DocPage />} />
            <Route path="/qa" element={<QaIndexPage />} />
            <Route path="/qa/:docId" element={<QaBankPage />} />
            <Route path="/qa/:docId/session" element={<QaSessionPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/more" element={<MorePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </StoreProvider>
  );
}
