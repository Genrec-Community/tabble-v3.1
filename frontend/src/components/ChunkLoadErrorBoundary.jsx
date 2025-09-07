// ChunkLoadErrorBoundary.jsx
import React from 'react';

class ChunkLoadErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Check if the error is a chunk loading error
        if (error.name === 'ChunkLoadError') {
            return { hasError: true };
        }
        return { hasError: false };
    }

    componentDidCatch(error, errorInfo) {
        if (error.name === 'ChunkLoadError') {
            console.error("Caught a chunk loading error. Forcing a page refresh.");
            window.location.reload();
        }
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI here
            return <h1>Loading new version...</h1>;
        }

        return this.props.children;
    }
}

export default ChunkLoadErrorBoundary;