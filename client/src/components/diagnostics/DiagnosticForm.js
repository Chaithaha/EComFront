import React, { useState } from "react";
import Button from "../common/Button";
import "../../styles/common.css";

const DiagnosticForm = ({ productId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    hardware_tests: {
      screen: true,
      camera: true,
      speakers: true,
      microphone: true,
      buttons: true,
      ports: true,
      wifi: true,
      bluetooth: true,
      gps: true,
      accelerometer: true,
      gyroscope: true,
      fingerprint: true,
      face_id: false,
    },
    battery_health: 100,
    performance_score: 100,
    overall_condition: "excellent",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hardwareTestLabels = {
    screen: "Screen/Display",
    camera: "Camera",
    speakers: "Speakers",
    microphone: "Microphone",
    buttons: "Physical Buttons",
    ports: "Charging/USB Ports",
    wifi: "Wi-Fi Connectivity",
    bluetooth: "Bluetooth",
    gps: "GPS",
    accelerometer: "Accelerometer",
    gyroscope: "Gyroscope",
    fingerprint: "Fingerprint Scanner",
    face_id: "Face ID",
  };

  const conditionOptions = [
    { value: "excellent", label: "Excellent (Like New)" },
    { value: "good", label: "Good (Minor Wear)" },
    { value: "fair", label: "Fair (Noticeable Wear)" },
    { value: "poor", label: "Poor (Heavy Wear)" },
  ];

  const handleHardwareTestChange = (test) => {
    setFormData((prev) => ({
      ...prev,
      hardware_tests: {
        ...prev.hardware_tests,
        [test]: !prev.hardware_tests[test],
      },
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/diagnostics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          product_id: productId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create diagnostic report");
      }

      const data = await response.json();
      onSubmit(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passedTests = Object.values(formData.hardware_tests).filter(
    Boolean,
  ).length;
  const totalTests = Object.keys(formData.hardware_tests).length;
  const hardwareScore = Math.round((passedTests / totalTests) * 100);

  return (
    <div className="diagnostic-form">
      <h3>Create Diagnostic Report</h3>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h4>Hardware Tests</h4>
          <div className="hardware-tests-grid">
            {Object.entries(hardwareTestLabels).map(([test, label]) => (
              <label key={test} className="hardware-test-item">
                <input
                  type="checkbox"
                  checked={formData.hardware_tests[test]}
                  onChange={() => handleHardwareTestChange(test)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="hardware-score">
            <strong>Hardware Score: {hardwareScore}%</strong>
            <div className="score-bar">
              <div
                className="score-fill"
                style={{ width: `${hardwareScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Battery Health</h4>
          <div className="battery-health-input">
            <input
              type="range"
              min="0"
              max="100"
              value={formData.battery_health}
              onChange={(e) =>
                handleInputChange("battery_health", parseInt(e.target.value))
              }
              className="battery-slider"
            />
            <span className="battery-value">{formData.battery_health}%</span>
          </div>
        </div>

        <div className="form-section">
          <h4>Performance Score</h4>
          <div className="performance-input">
            <input
              type="range"
              min="0"
              max="100"
              value={formData.performance_score}
              onChange={(e) =>
                handleInputChange("performance_score", parseInt(e.target.value))
              }
              className="performance-slider"
            />
            <span className="performance-value">
              {formData.performance_score}%
            </span>
          </div>
        </div>

        <div className="form-section">
          <h4>Overall Condition</h4>
          <div className="condition-options">
            {conditionOptions.map((option) => (
              <label key={option.value} className="condition-option">
                <input
                  type="radio"
                  name="condition"
                  value={option.value}
                  checked={formData.overall_condition === option.value}
                  onChange={(e) =>
                    handleInputChange("overall_condition", e.target.value)
                  }
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h4>Additional Notes</h4>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Any additional observations or issues..."
            rows="4"
            className="notes-textarea"
          />
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating Report..." : "Create Report"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DiagnosticForm;
