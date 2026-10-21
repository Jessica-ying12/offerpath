import { Link } from "react-router-dom";
import { EmptyState, PageContainer } from "../components/ui";

export function NotFoundPage() {
  return (
    <PageContainer className="max-w-2xl">
      <EmptyState
        title="页面不存在"
        description="链接可能已经变化。回到总览继续学习。"
        action={
          <div className="flex gap-2">
            <Link to="/" className="btn-primary">回到总览</Link>
            <Link to="/docs" className="btn-ghost">打开文档库</Link>
          </div>
        }
      />
    </PageContainer>
  );
}
