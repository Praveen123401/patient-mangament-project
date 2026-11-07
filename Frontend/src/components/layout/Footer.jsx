import { HOSPITAL_NAME } from "../../utils/constants";

export default function Footer() {
  return (
    <footer className="app-footer no-print">
      © {new Date().getFullYear()} {HOSPITAL_NAME}. All rights reserved.
    </footer>
  );
}