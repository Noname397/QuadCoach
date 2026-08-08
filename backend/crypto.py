from cryptography.fernet import Fernet
import os

ENCRYPTION_KEY = os.environ["ENCRYPTION_KEY"]
cipher = Fernet(ENCRYPTION_KEY.encode())

def encrypt_key(raw_key: str) -> str:
    return cipher.encrypt(raw_key.encode()).decode()

def decrypt_key(encrypted_key: str) -> str:
    return cipher.decrypt(encrypted_key.encode()).decode()