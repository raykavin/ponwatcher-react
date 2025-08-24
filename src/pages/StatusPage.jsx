import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ConnectivityStatus from "../components/ConnectivityStatus";
import {
  fetchConnectionData,
  fetchConnectionDataDebounced,
  cancelAllPendingRequests,
  cancelPendingRequest,
  cleanupOldRequests,
} from "../services/api";

const StatusPage = ({ formData }) => {
  const navigate = useNavigate();

  // State management
  const [connections, setConnections] = useState([]);
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date());
  const [transitioningConnections, setTransitioningConnections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isManualUpdating, setIsManualUpdating] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [firstDataFetched, setFirstDataFetched] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    requestCount: 0,
    cachedRequests: 0,
    pendingTimers: 0,
    lastRequestKey: "",
    requestHistory: [],
  });

  // Refs
  const prevConnectionsRef = useRef([]);
  const requestCountRef = useRef(0);
  const searchDebounceRef = useRef(null);

  // Helper functions
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const updateDebugInfo = (operation = "", details = "") => {
    setDebugInfo((prev) => ({
      ...prev,
      requestCount: requestCountRef.current,
      cachedRequests: window.requestCache?.size || 0,
      pendingTimers: window.debounceTimers?.size || 0,
      lastRequestKey: `${formData.slot}-${formData.card}-${formData.olt}${
        searchTerm.trim() ? "-" + searchTerm.trim() : ""
      }`,
      requestHistory: [
        ...prev.requestHistory.slice(-9),
        {
          timestamp: new Date().toLocaleTimeString(),
          operation,
          details,
          id: requestCountRef.current,
        },
      ],
    }));
  };

  const detectTransitioningConnections = (newData) => {
    if (prevConnectionsRef.current.length === 0) return [];

    const newTransitioning = [];
    prevConnectionsRef.current.forEach((prevConn) => {
      if (prevConn.status === "online") {
        const newConn = newData.find((conn) => conn.name === prevConn.name);
        if (newConn && newConn.status === "offline") {
          newTransitioning.push({
            ...prevConn,
            transition: "online-to-offline",
          });
        }
      }
    });

    return newTransitioning;
  };

  const handleTransitioningConnections = (newTransitioning) => {
    if (newTransitioning.length > 0) {
      console.log(
        "Transitioning connections detected:",
        newTransitioning.map((c) => c.name)
      );
      setTransitioningConnections(newTransitioning);

      // Clear transitioning connections after animation completes
      setTimeout(() => {
        setTransitioningConnections([]);
      }, 2000);
    }
  };

  const cancelCurrentRequests = () => {
    cancelPendingRequest(
      formData.slot,
      formData.card,
      formData.olt,
      searchTerm
    );

    requestCountRef.current++;

    setLoading(false);
    setIsManualUpdating(false);

    updateDebugInfo("CANCEL", "Requests cancelled by user");
    console.log("Requests cancelled by user");
  };

  const loadData = async (isManual = false, useDebounce = true) => {
    const currentRequestId = ++requestCountRef.current;

    if (isManual) {
      setIsManualUpdating(true);
      updateDebugInfo("MANUAL_START", `Manual request #${currentRequestId}`);
    } else {
      setLoading(true);
      updateDebugInfo("AUTO_START", `Automatic request #${currentRequestId}`);
    }

    try {
      let data;

      if (useDebounce && !isManual) {
        data = await fetchConnectionDataDebounced(
          formData.slot,
          formData.card,
          formData.olt,
          searchTerm,
          300
        );
      } else {
        data = await fetchConnectionData(
          formData.slot,
          formData.card,
          formData.olt,
          searchTerm
        );
      }

      if (currentRequestId !== requestCountRef.current) {
        updateDebugInfo("OUTDATED", `Request #${currentRequestId} discarded`);
        console.log(`Request ${currentRequestId} was outdated, discarding`);
        return;
      }

      const newTransitioning = detectTransitioningConnections(data);
      handleTransitioningConnections(newTransitioning);

      // Update state
      prevConnectionsRef.current = [...data];
      setConnections(data);
      setTimestamp(new Date());

      // Mark that initial load has happened
      if (!hasInitialLoad) {
        setHasInitialLoad(true);
      }

      updateDebugInfo(
        "SUCCESS",
        `Request #${currentRequestId} completed with ${data.length} results`
      );
    } catch (error) {
      if (error.name === "AbortError") {
        updateDebugInfo("ABORTED", `Request #${currentRequestId} aborted`);
        console.log(`Request ${currentRequestId} was cancelled`);
        return;
      }

      // Only show error if it's the most recent request
      if (currentRequestId === requestCountRef.current) {
        updateDebugInfo(
          "ERROR",
          `Error in request #${currentRequestId}: ${error.message}`
        );
        console.error("Failed to fetch connection data:", error);
      }
    } finally {
      if (connections) setFirstDataFetched(true);
      if (currentRequestId === requestCountRef.current) {
        setLoading(false);
        setIsManualUpdating(false);
      }
    }
  };

  // Event handlers
  const handleManualUpdate = () => {
    console.log("handleManualUpdate clicked", { isManualUpdating, loading });

    if (isManualUpdating || loading) {
      console.log("Attempting to cancel...");
      cancelCurrentRequests();
    } else {
      console.log("Starting manual update...");
      loadData(true, false); // Manual, without debounce
    }
  };

  const handleSearchInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);

    // Cancel previous debounce
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Set new debounce for search
    searchDebounceRef.current = setTimeout(() => {
      if (connections.length > 0) {
        // Only search if we already have data
        loadData(false, true); // Automatic, with debounce
      }
    }, 500); // 500ms for search
  };

  const clearSearch = () => {
    setSearchTerm("");
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
  };

  const navigateToHome = () => {
    // Cancel all pending requests before navigating
    cancelAllPendingRequests();
    navigate("/");
  };

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  const handleCleanupCache = () => {
    cleanupOldRequests(60000); // Clean requests older than 1 minute
    updateDebugInfo("CLEANUP", "Cache cleaned manually");
  };

  // Effects
  useEffect(() => {
    // Redirect if no form data
    if (!formData.slot && !formData.card) {
      navigate("/");
      return;
    }

    // Load initial data
    // loadData(false, false);

    // Cleanup function
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      // Cancel all pending requests
      cancelAllPendingRequests();
    };
  }, [formData, navigate]);

  // Separate useEffect for auto-refresh - only starts after initial load
  useEffect(() => {
    if (!hasInitialLoad) return;

    const intervalId = setInterval(() => {
      if (!loading && !isManualUpdating) {
        loadData(false, false);
      }
    }, 10000);

    // Automatic cache cleanup every 5 minutes
    const cleanupInterval = setInterval(() => {
      cleanupOldRequests();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(cleanupInterval);
    };
  }, [hasInitialLoad, loading, isManualUpdating, searchTerm]);

  // Filter connections based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredConnections(connections);
    } else {
      const filtered = connections.filter(
        (connection) =>
          connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (connection.client_name &&
            connection.client_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
      setFilteredConnections(filtered);
    }
  }, [connections, searchTerm]);

  // Update debug info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo((prev) => ({
        ...prev,
        cachedRequests: window.requestCache?.size || 0,
        pendingTimers: window.debounceTimers?.size || 0,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Computed values
  const connectionsByStatus = {
    online: filteredConnections.filter((conn) => conn.status === "online"),
    offline: filteredConnections.filter((conn) => conn.status === "offline"),
    updating: filteredConnections.filter((conn) => conn.status === "updating"),
  };

  // const allConnectionsAreUpdating =
  //   filteredConnections.length > 0 &&
  //   connectionsByStatus.updating.length === filteredConnections.length;

  // Render helpers
  const renderDebugPanel = () => {
    if (!showDebug) return null;

    return (
      <div className="bg-gray-800 border border-yellow-600 rounded-lg p-3 mt-2 text-xs">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-yellow-400 font-semibold">Debug Information</h3>
          <button
            onClick={handleCleanupCache}
            className="bg-yellow-700 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
          >
            Clean Cache
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <div>
            <span className="text-yellow-300">Current ID:</span>
            <span className="text-white ml-1">{debugInfo.requestCount}</span>
          </div>
          <div>
            <span className="text-yellow-300">Cache:</span>
            <span className="text-white ml-1">{debugInfo.cachedRequests}</span>
          </div>
          <div>
            <span className="text-yellow-300">Timers:</span>
            <span className="text-white ml-1">{debugInfo.pendingTimers}</span>
          </div>
          <div>
            <span className="text-yellow-300">Key:</span>
            <span className="text-white ml-1 break-all">
              {debugInfo.lastRequestKey}
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-yellow-300 mb-1">Request History:</h4>
          <div className="bg-gray-900 rounded p-2 max-h-32 overflow-y-auto">
            {debugInfo.requestHistory.length === 0 ? (
              <div className="text-gray-400">No requests yet</div>
            ) : (
              debugInfo.requestHistory
                .slice()
                .reverse()
                .map((req, index) => (
                  <div key={index} className="text-xs mb-1">
                    <span className="text-cyan-400">{req.timestamp}</span>
                    <span className="text-white ml-2">#{req.id}</span>
                    <span className="text-yellow-400 ml-2">
                      {req.operation}
                    </span>
                    <span className="text-gray-300 ml-2">{req.details}</span>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="mt-2 text-xs">
          <span className="text-yellow-300">Auto-refresh:</span>
          <span className="text-white ml-1">
            {hasInitialLoad ? "Active" : "Waiting for first manual load"}
          </span>
        </div>
      </div>
    );
  };

  const renderHeader = () => (
    <header className="flex-shrink-0 border border-cyan-800 p-2 sm:p-4 lg:p-6 pb-2 sm:pb-4">
      <div className="flex flex-col gap-2 sm:gap-4">
        <img
          src="/assets/images/logo-fibralink.svg"
          alt="Fibralink Logo"
          className="w-40 sm:w-48 md:w-56 lg:w-64 object-contain"
        />
        <hr className="border-1 w-full border-cyan-400" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-2 sm:mb-4">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-cyan-400 mb-2 lg:mb-0 leading-tight">
            MONITORANDO CONEXÕES DA PON
          </h1>
          <div className="flex flex-col items-start lg:items-end text-sm sm:text-base">
            <div className="text-cyan-300 mb-1 flex flex-wrap items-center gap-1 sm:gap-2">
              <span className="text-cyan-500">SLOT:</span>
              <span className="font-semibold">{formData.slot}</span>
              <span className="text-cyan-500 ml-2 sm:ml-4">CARD:</span>
              <span className="font-semibold">{formData.card}</span>
              <span className="text-cyan-500 ml-2 sm:ml-4">OLT:</span>
              <span className="font-semibold">{formData.olt}</span>
            </div>
            <div className="text-cyan-400 text-xs sm:text-sm">
              ATUALIZADO EM:{" "}
              <span className="text-white font-mono">
                {formatTime(timestamp)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Update Controls */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="flex flex-1 max-w-full sm:max-w-md">
          <input
            type="text"
            name="search"
            placeholder="Buscar conexão..."
            value={searchTerm}
            onChange={handleSearchInputChange}
            className="flex-1 bg-gray-800 border border-cyan-700 rounded-l-md px-2 sm:px-4 py-2 text-sm sm:text-base text-cyan-100 placeholder-cyan-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="bg-cyan-700 hover:bg-cyan-600 text-white px-2 sm:px-3 py-2 border border-cyan-600 transition-colors duration-200 text-sm sm:text-base"
              title="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleManualUpdate}
            className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-md border transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
              isManualUpdating || loading
                ? "bg-red-700 hover:bg-red-600 border-red-600 text-white"
                : "bg-cyan-700 hover:bg-cyan-600 border-cyan-600 text-white"
            }`}
          >
            <span className={isManualUpdating || loading ? "animate-spin" : ""}>
              {isManualUpdating || loading ? "⟳" : "↻"}
            </span>
            <span className="hidden sm:inline">
              {isManualUpdating || loading ? "CANCELAR" : "ATUALIZAR"}
            </span>
            <span className="sm:hidden">
              {isManualUpdating || loading ? "PARAR" : "SYNC"}
            </span>
          </button>

          <button
            onClick={toggleDebug}
            className={`px-3 py-2 rounded-md border text-sm transition-all duration-200 ${
              showDebug
                ? "bg-yellow-700 hover:bg-yellow-600 border-yellow-600 text-white"
                : "bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"
            }`}
            title="Toggle Debug"
          >
            🐛
          </button>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-cyan-300">
          {filteredConnections.length === 0 ? (
            <span className="text-yellow-400">
              "{searchTerm}" não encontrado. Atualize para buscar remotamente.
            </span>
          ) : (
            <span>
              Mostrando {filteredConnections.length} de {connections.length}{" "}
              conexões
              {filteredConnections.length !== connections.length &&
                ` para "${searchTerm}"`}
            </span>
          )}
        </div>
      )}

      {/* Debug Panel */}
      {renderDebugPanel()}
    </header>
  );

  const renderLoadingState = () => (
    <div className="flex justify-center items-center h-full p-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-cyan-400"></div>
          <div className="text-cyan-400 text-lg sm:text-xl">
            OBTENDO INFORMAÇÕES...
          </div>
        </div>
        <div className="text-cyan-300 text-xs sm:text-sm">
          Pressione "CANCELAR" para interromper
        </div>
        {showDebug && (
          <div className="text-yellow-400 text-xs">
            Request #{requestCountRef.current} in progress
          </div>
        )}
      </div>
    </div>
  );

  // const renderUpdatingState = () => (
  //   <div className="h-full flex flex-col p-2 sm:p-4">
  //     <div className="flex-shrink-0 mb-4">
  //       <h2 className="text-lg sm:text-xl text-yellow-400 mb-2 sm:mb-4 border-b border-yellow-800 pb-2">
  //         ATUALIZANDO CONEXÕES
  //       </h2>
  //       <div className="text-yellow-300 mb-2 text-sm sm:text-base">
  //         TOTAL: {connectionsByStatus.updating.length}
  //       </div>
  //     </div>
  //     <div className="flex-1 overflow-y-auto">
  //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 pb-4">
  //         {connectionsByStatus.updating.map((connection, index) => (
  //           <ConnectivityStatus
  //             key={index}
  //             client_name={connection.client_name}
  //             name={connection.name}
  //             status={connection.status}
  //             details={connection.details}
  //           />
  //         ))}
  //       </div>
  //     </div>
  //   </div>
  // );

  const renderConnectionPanel = (
    title,
    connections,
    statusClass,
    borderClass
  ) => (
    <div
      className={`flex-1 bg-gray-800/30 rounded-lg border ${borderClass} flex flex-col min-h-0`}
    >
      <div
        className={`flex-shrink-0 p-2 sm:p-4 border-b ${borderClass
          .replace("border-", "border-")
          .replace("/50", "/50")}`}
      >
        <h2
          className={`text-base sm:text-lg lg:text-xl ${statusClass} mb-1 sm:mb-2`}
        >
          {title}
        </h2>
        <div
          className={`${statusClass.replace(
            "400",
            "300"
          )} text-sm sm:text-base`}
        >
          TOTAL: {connections.length}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
        <div className="space-y-1">
          {connections.map((connection, index) => {
            const isOffline = title === "OFFLINE";
            const justTransitioned =
              isOffline &&
              transitioningConnections.some(
                (tc) => tc.name === connection.name
              );

            return (
              <div
                key={`${title.toLowerCase()}-${connection.name}-${index}`}
                className={
                  justTransitioned
                    ? "animate-pulse border-l-4 border-yellow-400 pl-2"
                    : ""
                }
              >
                <ConnectivityStatus
                  client_name={connection.client_name}
                  name={connection.name}
                  status={connection.status}
                  details={connection.details}
                  isActive={title === "ONLINE"}
                  isNew={justTransitioned}
                />
              </div>
            );
          })}

          {/* Show transitioning elements for online panel */}
          {title === "ONLINE" &&
            transitioningConnections.map((connection, index) => (
              <div
                key={`transition-${connection.name}-${index}`}
                className="animate-pulse opacity-75"
              >
                <ConnectivityStatus
                  name={connection.name}
                  status="online"
                  details={connection.details}
                  isTransitioning={true}
                />
              </div>
            ))}

          {connections.length === 0 &&
            (title !== "ONLINE" || transitioningConnections.length === 0) && (
              <div className="text-gray-400 italic text-sm sm:text-base p-2 text-center">
                Nenhuma conexão {title.toLowerCase()}
              </div>
            )}
        </div>
      </div>
    </div>
  );

  const renderNormalState = () => (
    <div className="h-full flex flex-col xl:flex-row xl:space-x-4 space-y-2 xl:space-y-0 p-2 sm:p-4 min-h-0">
      {renderConnectionPanel(
        "ONLINE",
        connectionsByStatus.online,
        "text-green-400",
        "border-green-900/50"
      )}
      {renderConnectionPanel(
        "OFFLINE",
        connectionsByStatus.offline,
        "text-red-400",
        "border-red-900/50"
      )}
    </div>
  );

  const renderFooter = () => (
    <footer className="flex-shrink-0 border border-cyan-800 p-2 sm:p-4 text-center text-cyan-600 text-sm">
      <button
        onClick={navigateToHome}
        className="bg-gray-800 hover:bg-gray-700 text-cyan-400 py-2 px-4 sm:px-6 rounded border border-cyan-700 transition-all duration-300 text-sm sm:text-base"
      >
        INÍCIO
      </button>
    </footer>
  );

  const renderMainContent = () => {
    // Show loading state when actively loading first data fetched is false
    if ((loading || isManualUpdating) && !firstDataFetched) {
      return renderLoadingState();
    }

    // if (allConnectionsAreUpdating) {
    //   return renderUpdatingState();
    // }

    return renderNormalState();
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col p-1 sm:p-2">
      {renderHeader()}
      <main className="flex-1 overflow-hidden border border-cyan-800 min-h-0">
        {renderMainContent()}
      </main>
      {renderFooter()}
    </div>
  );
};

export default StatusPage;
