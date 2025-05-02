from flask import Flask, render_template
from routes.video_routes import video_bp

def create_app():
    """
    Application factory function.
    """
    app = Flask(__name__)
    
    # Register blueprints
    app.register_blueprint(video_bp)
    
    # Root route
    @app.route('/')
    def index():
        return render_template('index.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)