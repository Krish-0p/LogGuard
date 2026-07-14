with open("app/api/v1/auth.py", "r") as f:
    text = f.read()

text = text.replace("async def signup(credentials: SignupRequest):", "async def signup(credentials: SignupRequest):\n    try:")
text = text.replace('return {"access_token": access_token', 'except Exception as e:\n        import traceback\n        traceback.print_exc()\n        raise HTTPException(status_code=500, detail=str(e))\n    return {"access_token": access_token')

with open("app/api/v1/auth.py", "w") as f:
    f.write(text)
