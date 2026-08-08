import streamlit as st
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_ANON_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

st.title("QuadCoach")

if "user" not in st.session_state:
    st.session_state.user = None

if st.session_state.user is None:
    tab1, tab2 = st.tabs(["Login", "Sign Up"])

    with tab1:
        email = st.text_input("Email", key="login_email")
        password = st.text_input("Password", type="password", key="login_pw")
        if st.button("Log In"):
            try:
                res = supabase.auth.sign_in_with_password({"email": email, "password": password})
                st.session_state.user = res.user
                st.rerun()
            except Exception as e:
                st.error(f"Login failed: {e}")

    with tab2:
        email_su = st.text_input("Email", key="signup_email")
        password_su = st.text_input("Password", type="password", key="signup_pw")
        
        if st.button("Sign Up"):
            try:
                supabase.auth.sign_up({"email": email_su, "password": password_su})
                st.session_state.pending_email = email_su
                st.session_state.pending_password = password_su
                st.success("Check your email for a 6-digit code.")
            except Exception as e:
                st.error(f"Signup failed: {e}")

        if "pending_email" in st.session_state:
            code = st.text_input("Enter 6-digit code", key="otp_code")
            if st.button("Verify"):
                try:
                    res = supabase.auth.verify_otp({
                        "email": st.session_state.pending_email,
                        "token": code,
                        "type": "email"
                    })
                    st.session_state.user = res.user
                    del st.session_state.pending_email
                    st.rerun()
                except Exception as e:
                    st.error(f"Verification failed: {e}")
else:
    st.write(f"Logged in as {st.session_state.user.email}")
    if st.button("Log Out"):
        supabase.auth.sign_out()
        st.session_state.user = None
        st.rerun()