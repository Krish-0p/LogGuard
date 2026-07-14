with open("frontend/src/pages/LogAnalytics.tsx", "r") as f:
    content = f.read()

content = content.replace("...HEADERS\n          ...HEADERS", "...HEADERS")

with open("frontend/src/pages/LogAnalytics.tsx", "w") as f:
    f.write(content)
