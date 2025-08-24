import React, { useEffect, useState } from "react";

export const ConnectivityStatus = ({
  client_name,
  name,
  status,
  details,
  isTransitioning = false,
  isNew = false,
  isActive = false,
}) => {
  const [animationState, setAnimationState] = useState(
    isTransitioning ? "start" : isNew ? "appear" : "none"
  );

  useEffect(() => {
    let timeout;

    if (isTransitioning) {
      // Start the transition animation for disappearing items
      setAnimationState("start");

      // After a brief pause, move to the blink animation
      timeout = setTimeout(() => {
        setAnimationState("blink");
      }, 100);
    } else if (isNew) {
      // Animation for newly appearing items in offline section
      setAnimationState("appear");

      // Reset the animation state after it completes
      timeout = setTimeout(() => {
        setAnimationState("none");
      }, 1500);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isTransitioning, isNew]);
  // Determine status color and animation
  const getStatusStyle = () => {
    switch (status.toLowerCase()) {
      case "online":
        return "bg-lime-500";
      case "updating":
        return "bg-yellow-500";
      case "offline":
        return "bg-red-500 animate-pulse";
      default:
        return "bg-gray-500";
    }
  };

  // Determine text color based on status
  const getTextColor = () => {
    switch (status.toLowerCase()) {
      case "online":
        return "text-green-400";
      case "updating":
        return "text-yellow-400";
      case "offline":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  // Determine the CSS classes based on the animation state for transitioning elements
  const getTransitionClass = () => {
    if (isTransitioning) {
      switch (animationState) {
        case "start":
          return "scale-100 opacity-100";
        case "blink":
          return "scale-105 opacity-80 animate-transition-blink border-yellow-500";
        default:
          return "";
      }
    } else if (isNew) {
      switch (animationState) {
        case "appear":
          return "animate-new-item border-yellow-500";
        default:
          return "";
      }
    }
    return "";
  };

  return (
    <div
      className={`bg-gray-800 rounded-md border border-gray-700 p-3 hover:border-cyan-700 relative overflow-hidden group transition-all duration-300 ${getTransitionClass()}`}
      style={{
        animation: isTransitioning
          ? "fadeOutUp 1.5s forwards"
          : isNew && animationState === "appear"
          ? "fadeInDown 1s forwards"
          : "none",
      }}
    >
      {/* Tech-style decorative corner */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-600 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-cyan-600 opacity-50"></div>

      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isTransitioning ? "bg-yellow-500 animate-ping" : getStatusStyle()
            }`}
          ></div>
          <div className="flex-1">
            {client_name ? (
              <h4 className="font-semibold tracking-wider">{client_name}</h4>
            ) : (
              <h4 className="font-semibold tracking-wider">{name}</h4>
            )}
          </div>
        </div>

        {status !== "updating" && (
          <div className="ml-6 text-xs">
            <span className={getTextColor()}>{details}</span>
          </div>
        )}
      </div>

      {/* Tech-style hover effect */}
      <div className="absolute inset-0 bg-cyan-800 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>

      {/* Visual indicator for transitioning elements */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-yellow-500 opacity-5"></div>
      )}
    </div>
  );
};
