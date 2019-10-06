window.openSSE = function() {
    const connection = new EventSource('/example/sse');

    connection.onopen = event => {
        log('SSE onopen', event);
    };

    connection.onerror = event => {
        log('SSE onerror', event);
    };

    connection.onmessage = event => {
        log('SSE onmessage', event);
    };

    connection.addEventListener('mes', event => {
        log('SSE mes event', event);
    });
};

function log() {
    const message = Array.from(arguments).map(JSON.stringify).join(' ');
    const p = document.createElement('p');

    p.innerText = message;
    document.body.appendChild(p);

    console.log(...arguments);
}

openSSE();
