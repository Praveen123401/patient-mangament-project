import Modal from "./Modal";

export default function ConfirmDialog({ open, title = "Are you sure?", message, confirmText = "Confirm", danger, loading, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} disabled={loading} onClick={onConfirm}>
            {loading ? "Please wait..." : confirmText}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}