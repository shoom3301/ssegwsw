window.openSSE = function() {
    const connection = new EventSource('/example/sse');

    connection.onopen = event => {
        console.log('SSE onopen', event);
    };

    connection.onerror = event => {
        console.log('SSE onerror', event);
    };

    connection.onmessage = event => {
        console.log('SSE onmessage', event);
    };

    connection.addEventListener('mes', event => {
        console.log('SSE mes event', event);
    });
};

openSSE();
