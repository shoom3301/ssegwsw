self.addEventListener('fetch', event => {
    const {headers, url} = event.request;
    const isSSERequest = headers.get('Accept') === 'text/event-stream';

    // Process only SSE connections
    if (!isSSERequest) {
        return;
    }

    // Headers for SSE response
    const sseHeaders = {
        'content-type': 'text/event-stream',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
    };
    // Function for formatting message to SSE response
    const sseChunkData = (data, event, retry, id) =>
        Object.entries({event, id, data, retry})
            .filter(([, value]) => ![undefined, null].includes(value))
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n') + '\n\n';

    // Map with server connections, where key - url, value - EventSource
    const serverConnections = {};
    // For each request opens only one server connection and use it for next requests with the same url
    const getServerConnection = url => {
        if (!serverConnections[url]) {
            serverConnections[url] = new EventSource(url);
        }

        return serverConnections[url];
    };
    // On message from server forward it to browser
    const onServerMessage = (controller, {data, type, retry, lastEventId}) => {
        const responseText = sseChunkData(data, type, retry, lastEventId);
        const responseData = Uint8Array.from(responseText, x => x.charCodeAt(0));
        controller.enqueue(responseData);
    };
    const stream = new ReadableStream({
        start: controller => {
            onServerMessage(controller, {data: 'Hello!'});

            getServerConnection(url).onmessage = onServerMessage.bind(null, controller);
        }
    });
    const response = new Response(stream, {headers: sseHeaders});

    event.respondWith(response);
});

self.addEventListener('install', (evt) => evt.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (evt) => evt.waitUntil(self.clients.claim()));