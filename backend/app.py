from flask import Flask
from flask_cors import CORS

from config import FRONTEND_URL
from routes.auth import auth_bp
from routes.health import health_bp
from routes.profile import profile_bp


def create_app():
    app = Flask(__name__)
    CORS(
        app,
        supports_credentials=True,
        resources={
            r"/api/*": {"origins": FRONTEND_URL},
            r"/auth/*": {"origins": FRONTEND_URL},
        },
    )

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
