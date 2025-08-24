import React from "react";

// Real API service to fetch connection data from backend with request control
const API_BASE_URL = 'https://localhost:3000/api/v1';

// Store for ongoing requests and debounced calls
const requestCache = new Map();
const debounceTimers = new Map();

// Generate a unique key for caching requests
const generateRequestKey = (slot, card, olt, searchParam = '') => {
    return `${slot}-${card}-${olt}${searchParam.trim() ? '-' + searchParam : ''}`;
};

// Transform API response to match the expected format in the React components
const transformApiResponse = (apiData) => {
    const connections = [];

    if (apiData?.data?.online?.onus) {
        apiData.data.online.onus.forEach(onu => {
            connections.push({
                client_name: onu?.client_name,
                name: onu.device_name,
                status: 'online',
                details: `${onu?.splitter_name ? 'CTO: ' + onu?.splitter_name + ' | ' : ''}${onu?.splitter_port ? 'Porta CTO: ' + onu?.splitter_port + ' | ' : ''}` +
                    `Opt. RX: ${onu.rx_power} dBm | Opt. TX: ${onu.tx_power} dBm | Temp: ${onu.temperature}°C | Volt: ${onu.voltage} V`,
            });
        });
    }

    if (apiData?.data?.offline?.onus) {
        apiData.data.offline.onus.forEach(onu => {
            connections.push({
                client_name: onu?.client_name,
                name: onu.device_name,
                status: 'offline',
                details: `${onu?.splitter_name ? 'CTO: ' + onu?.splitter_name + ' | ' : ''}${onu?.splitter_port ? 'Porta CTO: ' + onu?.splitter_port + ' | ' : ''}`,
            });
        });
    }

    return connections;
};

// Debounced version of fetchConnectionData
export const fetchConnectionDataDebounced = (slot, card, olt, searchParam = '', delay = 300) => {
    return new Promise((resolve, reject) => {
        const requestKey = generateRequestKey(slot, card, olt, searchParam);

        // Clear existing timer for this request key
        if (debounceTimers.has(requestKey)) {
            clearTimeout(debounceTimers.get(requestKey));
        }

        // Set new timer
        const timer = setTimeout(async () => {
            try {
                const result = await fetchConnectionData(slot, card, olt, searchParam);
                resolve(result);
            } catch (error) {
                reject(error);
            } finally {
                debounceTimers.delete(requestKey);
            }
        }, delay);

        debounceTimers.set(requestKey, timer);
    });
};

// Cancel all pending debounced requests
export const cancelAllPendingRequests = () => {
    // Cancel debounced timers
    debounceTimers.forEach(timer => clearTimeout(timer));
    debounceTimers.clear();

    // Cancel ongoing requests
    requestCache.forEach(({ abortController }) => {
        if (abortController && !abortController.signal.aborted) {
            abortController.abort();
        }
    });
    requestCache.clear();
};

// Cancel specific pending request
export const cancelPendingRequest = (slot, card, olt, searchParam = '') => {
    const requestKey = generateRequestKey(slot, card, olt, searchParam);

    // Cancel debounced timer
    if (debounceTimers.has(requestKey)) {
        clearTimeout(debounceTimers.get(requestKey));
        debounceTimers.delete(requestKey);
    }

    // Cancel ongoing request
    if (requestCache.has(requestKey)) {
        const { abortController } = requestCache.get(requestKey);
        if (abortController && !abortController.signal.aborted) {
            abortController.abort();
        }
        requestCache.delete(requestKey);
    }
};

// Fetch connection data from real API with request deduplication
export const fetchConnectionData = async (slot, card, olt, searchParam = '') => {
    const requestKey = generateRequestKey(slot, card, olt, searchParam);

    // Check if there's already an ongoing request for the same parameters
    if (requestCache.has(requestKey)) {
        console.log('Reusing existing request for:', requestKey);
        // Return the existing promise
        return requestCache.get(requestKey).promise;
    }

    // Create new AbortController for this request
    const abortController = new AbortController();

    // Create the request promise
    const requestPromise = (async () => {
        try {
            // Build query parameters
            const params = new URLSearchParams({
                slot: slot,
                card: card,
                olt: olt,
            });

            // Add search parameter if provided
            if (searchParam && searchParam.trim() !== '') {
                params.append('s', searchParam.trim());
            }

            const url = `${API_BASE_URL}/pon-watcher?${params.toString()}`;

            console.log('Making new request for:', requestKey);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: abortController.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const apiData = await response.json();

            // Check if API returned success status
            if (apiData.status !== 'OK') {
                throw new Error('API returned error status');
            }

            // Transform API response to match component expectations
            const transformedData = transformApiResponse(apiData);

            return transformedData;

        } catch (error) {
            // If the request was aborted, throw the AbortError
            if (error.name === 'AbortError') {
                console.log('Request was aborted for:', requestKey);
                throw error;
            }

            console.error('Failed to fetch connection data:', error);
            throw error;
        } finally {
            // Clean up the request from cache when it completes
            requestCache.delete(requestKey);
        }
    })();

    // Store the request in cache
    requestCache.set(requestKey, {
        promise: requestPromise,
        abortController: abortController,
        timestamp: Date.now()
    });

    return requestPromise;
};

// Custom hook for use with React
export const useConnectionData = () => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [data, setData] = React.useState([]);

    // Ref to store the current debounce timer
    const debounceRef = React.useRef(null);

    const fetchData = React.useCallback(async (slot, card, olt, searchParam = '') => {
        // Clear previous timer if exists
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Set new timer with debounce
        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await fetchConnectionData(slot, card, olt, searchParam);
                setData(result);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message);
                }
            } finally {
                setIsLoading(false);
            }
        }, 500); // 500ms delay
    }, []);

    // Cleanup
    React.useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return {
        data,
        isLoading,
        error,
        fetchData,
        cancelRequest: cancelAllPendingRequests
    };
};

// Utility function to clean up old cached requests (optional, for memory management)
export const cleanupOldRequests = (maxAge = 5 * 60 * 1000) => { // 5 minutes default
    const now = Date.now();

    requestCache.forEach((value, key) => {
        if (now - value.timestamp > maxAge) {
            if (value.abortController && !value.abortController.signal.aborted) {
                value.abortController.abort();
            }
            requestCache.delete(key);
        }
    });
};