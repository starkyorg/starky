import { FunctionComponent } from "react";
import styles from "../styles/DownloadButton.module.scss";

type DownloadButtonProps = {
  label: string;
  downloadUrl: string;
  filename: string;
  className?: string;
};

const DownloadButton: FunctionComponent<DownloadButtonProps> = ({
  label,
  downloadUrl,
  filename,
  className = "",
}) => {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    a.click();
  };

  return (
    <button
      onClick={handleDownload}
      className={`${styles.downloadButton} ${className}`}
    >
      {label}
    </button>
  );
};

export default DownloadButton;
