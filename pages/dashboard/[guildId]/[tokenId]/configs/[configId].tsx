import { useState, useEffect } from "react";
import { NextPage, GetServerSideProps } from "next";
import { useRouter } from "next/router";
import axios from "axios";
import Logo from "../../../../../components/Logo";
import SocialLinks from "../../../../../components/SocialLinks";
import RedirectMessage from "../../../../../components/RedirectMessage";
import Guild from "../../../../../components/guild/Guild";
import {
  setupDb,
  DiscordServerConfigRepository,
  DiscordServerRepository,
} from "../../../../../db";
import { getDiscordServerInfo } from "../../../../../discord/utils";
import { validateToken } from "../../../../../utils/validateToken";
import starkyModules from "../../../../../starkyModules";
import networks from "../../../../../configs/networks.json";
import styles from "../../../../../styles/Dashboard.module.scss";

interface Config {
  id: string;
  starknetNetwork: "goerli" | "mainnet" | "sepolia" | "ethereum-mainnet";
  discordRoleId: string;
  starkyModuleType: string;
  starkyModuleConfig: { [key: string]: string };
}

interface ConfigEditorPageProps {
  config?: Config;
  guildId: string;
  tokenId: string;
  discordServerName: string | null;
  discordServerIcon: string | null;
  error?: string;
}

const ConfigEditorPage: NextPage<ConfigEditorPageProps> = ({
  config,
  guildId,
  tokenId,
  discordServerName,
  discordServerIcon,
  error,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<Config | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (error === "Invalid or expired token.") {
    return (
      <RedirectMessage
        title="Session Expired"
        description="Your access token has expired. You'll be redirected shortly."
        redirectTo="/"
      />
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Logo />
        <h1>Error</h1>
        <p>{error}</p>
        <SocialLinks />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className={styles.container}>
        <Logo />
        <h1>Loading...</h1>
        <SocialLinks />
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      if (!prev) return null;
      
      if (field.startsWith("moduleConfig.")) {
        const configField = field.replace("moduleConfig.", "");
        return {
          ...prev,
          starkyModuleConfig: {
            ...prev.starkyModuleConfig,
            [configField]: value,
          },
        };
      }
      
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const response = await axios.put(`/api/configs/${formData.id}`, {
        guildId,
        token: tokenId,
        starknetNetwork: formData.starknetNetwork,
        discordRoleId: formData.discordRoleId,
        starkyModuleType: formData.starkyModuleType,
        starkyModuleConfig: formData.starkyModuleConfig,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/${guildId}/${tokenId}`);
      }, 2000);
    } catch (error: any) {
      setSubmitError(
        error.response?.data?.error || "An error occurred while updating the configuration"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedModule = starkyModules[formData.starkyModuleType];

  return (
    <div className={styles.container}>
      <Logo />
      <h1>Edit Configuration</h1>
      <Guild
        discordServerName={discordServerName!}
        discordServerIcon={discordServerIcon}
      />

      <section className={styles.configSection}>
        <form onSubmit={handleSubmit}>
          {/* Network Selection */}
          <div className={styles.configBlock}>
            <label>
              <strong>Starknet Network:</strong>
              <select
                value={formData.starknetNetwork}
                onChange={(e) => handleInputChange("starknetNetwork", e.target.value)}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.5rem",
                  borderRadius: "0.25rem",
                  border: "1px solid #e5e7eb",
                }}
              >
                {networks.map((network) => (
                  <option key={network.name} value={network.name}>
                    {network.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Discord Role ID */}
          <div className={styles.configBlock}>
            <label>
              <strong>Discord Role ID:</strong>
              <input
                type="text"
                value={formData.discordRoleId}
                onChange={(e) => handleInputChange("discordRoleId", e.target.value)}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.5rem",
                  borderRadius: "0.25rem",
                  border: "1px solid #e5e7eb",
                  minWidth: "200px",
                }}
                required
              />
            </label>
          </div>

          {/* Module Type Selection */}
          <div className={styles.configBlock}>
            <label>
              <strong>Starky Module Type:</strong>
              <select
                value={formData.starkyModuleType}
                onChange={(e) => handleInputChange("starkyModuleType", e.target.value)}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.5rem",
                  borderRadius: "0.25rem",
                  border: "1px solid #e5e7eb",
                }}
              >
                {Object.entries(starkyModules).map(([moduleId, module]) => (
                  <option key={moduleId} value={moduleId}>
                    {module.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Dynamic Module Configuration Fields */}
          {selectedModule && selectedModule.fields.length > 0 && (
            <div className={styles.configBlock}>
              <strong>Module Configuration:</strong>
              {selectedModule.fields.map((field) => (
                <div key={field.id} style={{ marginTop: "0.5rem" }}>
                  <label style={{ display: "block" }}>
                    {field.question}
                    {field.textarea ? (
                      <textarea
                        value={formData.starkyModuleConfig[field.id] || ""}
                        onChange={(e) =>
                          handleInputChange(`moduleConfig.${field.id}`, e.target.value)
                        }
                        placeholder={field.placeholder}
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          borderRadius: "0.25rem",
                          border: "1px solid #e5e7eb",
                          marginTop: "0.25rem",
                          minHeight: "100px",
                          fontFamily: "monospace",
                        }}
                        required
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData.starkyModuleConfig[field.id] || ""}
                        onChange={(e) =>
                          handleInputChange(`moduleConfig.${field.id}`, e.target.value)
                        }
                        placeholder={field.placeholder}
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          borderRadius: "0.25rem",
                          border: "1px solid #e5e7eb",
                          marginTop: "0.25rem",
                        }}
                        required
                      />
                    )}
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div style={{ marginTop: "2rem" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.downloadButton}
              style={{
                backgroundColor: isSubmitting ? "#9ca3af" : "#5865f2",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Updating..." : "Update Configuration"}
            </button>
            
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${guildId}/${tokenId}`)}
              style={{
                marginLeft: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>

          {/* Success/Error Messages */}
          {submitSuccess && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                backgroundColor: "#d1fae5",
                border: "1px solid #10b981",
                borderRadius: "0.5rem",
                color: "#065f46",
              }}
            >
              ✅ Configuration updated successfully! Redirecting to dashboard...
            </div>
          )}

          {submitError && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                backgroundColor: "#fee2e2",
                border: "1px solid #ef4444",
                borderRadius: "0.5rem",
                color: "#dc2626",
              }}
            >
              ❌ {submitError}
            </div>
          )}
        </form>
      </section>

      <SocialLinks />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  await setupDb();

  const { guildId, tokenId, configId } = query;

  if (
    !guildId ||
    typeof guildId !== "string" ||
    !tokenId ||
    typeof tokenId !== "string" ||
    !configId ||
    typeof configId !== "string"
  ) {
    if (res) res.statusCode = 400;
    return {
      props: {
        guildId: "",
        tokenId: "",
        error: "Missing or invalid guild ID, token, or config ID.",
      },
    };
  }

  // Validate token
  const isValidToken = await validateToken(guildId, tokenId);

  if (!isValidToken) {
    if (res) res.statusCode = 403;
    return {
      props: {
        guildId,
        tokenId,
        error: "Invalid or expired token.",
      },
    };
  }

  const discordServer = await DiscordServerRepository.findOneBy({
    id: guildId,
  });

  if (!discordServer) {
    if (res) res.statusCode = 404;
    return {
      props: {
        guildId,
        tokenId,
        error: "Guild not found.",
      },
    };
  }

  // Get the specific config
  const config = await DiscordServerConfigRepository.findOneBy({
    id: configId,
    discordServerId: guildId,
  });

  if (!config) {
    if (res) res.statusCode = 404;
    return {
      props: {
        guildId,
        tokenId,
        error: "Configuration not found.",
      },
    };
  }

  let discordServerName: string | null = null;
  let discordServerIcon: string | null = null;

  try {
    const info = await getDiscordServerInfo(guildId);
    discordServerName = info.name;
    if (info.icon) {
      const ext = info.icon.startsWith("a_") ? ".gif" : ".png";
      discordServerIcon = `https://cdn.discordapp.com/icons/${guildId}/${info.icon}${ext}`;
    }
  } catch (error) {
    console.error("Failed to fetch guild info:", error);
  }

  return {
    props: {
      config: {
        id: config.id,
        starknetNetwork: config.starknetNetwork,
        discordRoleId: config.discordRoleId,
        starkyModuleType: config.starkyModuleType,
        starkyModuleConfig: config.starkyModuleConfig,
      },
      guildId,
      tokenId,
      discordServerName,
      discordServerIcon,
    },
  };
};

export default ConfigEditorPage; 