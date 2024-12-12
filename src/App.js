import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Replace this with your ngrok URL
    const flaskApiUrl = "https://107174ab5e89.ngrok.app";

    axios
      .get(flaskApiUrl)
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error("Error connecting to Flask API:", error);
      });
  }, []);

  return (
    <div className="App">
      <h1>React and Flask Connection Test</h1>
      <p>{message ? message : "Loading..."}</p>
    </div>
  );
}

export default App;
