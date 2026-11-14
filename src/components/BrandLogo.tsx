import { MessageCircle } from "lucide-react";
import "./BrandLogo.css";

interface BrandLogoProps {
  small?: boolean;
}

const BrandLogo = ({ small = false }: BrandLogoProps) => (
  <span className={`brand-logo${small ? " brand-logo-small" : ""}`}>
    <span className="brand-logo-mark" aria-hidden="true">
      <MessageCircle size={small ? 20 : 23} />
    </span>
    <span>Chat <strong>Político</strong></span>
  </span>
);

export default BrandLogo;
