with open("frontend/src/App.tsx", "r") as f:
    content = f.read()

# Add import
import_statement = "import { LogAnalytics } from './pages/LogAnalytics'\nimport { RootCauseAnalysis } from './pages/RootCauseAnalysis'"
content = content.replace("import VerifyEmail from './pages/VerifyEmail'", f"import VerifyEmail from './pages/VerifyEmail'\n{import_statement}")

# Add routes
route_statement = "<Route path=\"/log-analytics\" element={<LogAnalytics />} />\n          <Route path=\"/rca/:anomalyId\" element={<RootCauseAnalysis />} />\n          <Route path=\"/rca\" element={<RootCauseAnalysis />} />"
content = content.replace("<Route path=\"*\" element={<Navigate to=\"/\" replace />} />", f"{route_statement}\n          <Route path=\"*\" element={{<Navigate to=\"/\" replace />}} />")

with open("frontend/src/App.tsx", "w") as f:
    f.write(content)
