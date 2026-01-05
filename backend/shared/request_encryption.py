import base64
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend


class RequestEncryption:
    
    def __init__(self):
        public_key_path = "./shared/encryptionKeys/public_key.pem"
        private_key_path = "./shared/encryptionKeys/private_key.pem"
        self.public_key = self._load_public_key(public_key_path)
        self.private_key = self._load_private_key(private_key_path)

    def _load_public_key(self, path: str):
        with open(path, "rb") as f:
            return serialization.load_pem_public_key(
                f.read(), backend=default_backend()
            )

    def _load_private_key(self, path: str):
        with open(path, "rb") as f:
            return serialization.load_pem_private_key(
                f.read(), password=None, backend=default_backend()
            )

    def get_pub_key_base64(self):
        pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        # print(pem)
        # print(base64.b64encode(pem))
        # print(base64.b64encode(pem).decode("utf-8"))

        return pem

    def encrypt(self, encryptable: str) -> bytes:
        return self.public_key.encrypt(
            # message.encode("utf-8"),
            encryptable,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )

    def decrypt(self, decryptable: str) -> str:
        decrypted_bytes = self.private_key.decrypt(
            base64.b64decode(decryptable),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )
        return decrypted_bytes.decode("utf-8")
