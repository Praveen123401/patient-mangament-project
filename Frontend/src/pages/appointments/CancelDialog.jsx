import { useState } from "react";
import Modal from "../../components/common/Modal";
import FormField from "../../components/common/FormField";

export default function CancelDialog({ open, patientName, loading, onConfirm, onClose }) {
  const [reason, setReason] = useState("");

  return (
    <Modal
      open={open}
      title="Cancel appointment"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Keep appointment</button>
          <button
            className="btn btn-danger"
            disabled={loading}
            onClick={async () => {
              await onConfirm(reason.trim());
              setReason("");
            }}
          >
            {loading ? "Cancelling..." : "Cancel appointment"}
          </button>
        </>
      }
    >
      <p>Cancel the appointment for <b>{patientName}</b>? The time slot becomes free again.</p>
      <FormField
        as="textarea"
        label="Reason (optional)"
        name="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
    </Modal>
  );
}