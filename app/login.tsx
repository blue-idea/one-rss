import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  completeThirdPartySignIn,
  signInWithThirdParty,
  type ThirdPartyProvider,
} from "@/modules/auth/api/thirdPartyAuth";
import { registerWithEmailPassword } from "@/modules/auth/api/registerWithEmailPassword";
import { sendEmailCode } from "@/modules/auth/api/sendEmailCode";
import { signInWithEmailPassword } from "@/modules/auth/api/signInWithEmailPassword";
import { verifyEmailCode } from "@/modules/auth/api/verifyEmailCode";
import { useOtpCooldown } from "@/modules/auth/hooks/useOtpCooldown";
import {
  getThirdPartyErrorMessage,
  getThirdPartyProviderLabel,
} from "@/modules/auth/thirdPartyAuthPresentation";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

/** Stitch 原型「登录与注册」资源（projects/11408602597176940484） */
const HERO_BACKGROUND_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDC5n4yj01w3P3YgLA8NlaiA_66BISqmkJWnCiopGKJz7E9yUwiJRLYGt_zkTn_7ESggtg-5DGw79UUyIrLb4e2LMXi5vIHxFnJfqL3Mc1MAIeTu1yU86kEJpfAmxjQLQMFpCjuhXy8IrxwdVIYElPkWIrdqyk1uTZibOs9ZBNa5tFEBoeNQtLL1nTpb-CIqW1X0LtqwLbBrbMEmIpoKxNOv6TQquK0vmNv-NfyGYP_r0qQoC3JweWtJQbe4PPH6QFJqtZyrjrggrz-";

const SOCIAL_APPLE_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC3BSlE1zaK_0TSdouWbqw7V3IoJzvCHuBKB-FiqIn0T-EvbKu6ln8FFqwlAwEr9ErmPn8DRhrkJxEkSMynZG3HbX4pbfPLSX-PmthUppGzf2TPasyr84NFZk8fH6d4NbgQg0gyHqExAnmynB0_mvy2jEjwL_Yyik9p0zAU5umV-rpHo1v1DepG_h6wSks4cFj7jFxl-h7WM9G9hXx3mFxm2LFgPcllhqbrD3CEE9YskatTHAfGA4VxtamuM5mhtV_V8S8T2uqYkdrK";

const SOCIAL_GOOGLE_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA3Vk7KQ7i41CwVbPP3EiTqawdRRdSkMvIyjNszFhdOeMiYmjJtB0amrHhknDTF17Zb8fXBSw8PkUaI0xaI0xaI5CkPMUwGMnKoNGkj_6Up2guCK6CGyS8ECLeb7BE77Vmcg1A8jqemWS3SeiHuVSQNKNzzpJrYIlBCb-vmbc8s2CAJaCfpa7F0UoBpTNlpThhbSTJ9_FunlZxBdnoJwfQ4sBlH7P0ENI83jSqJYFfQhOgj8VZAqELS7jVJC1T0uxFIxmS918ddqMG-qT0w";

type AuthMode = "login" | "register";
type RegisterStep = "verify" | "setPassword";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const colorScheme = "light";
  const colors = Colors[colorScheme];

  const [mode, setMode] = useState<AuthMode>("register");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerStep, setRegisterStep] = useState<RegisterStep>("verify");
  const [registrationCredential, setRegistrationCredential] = useState("");
  const [registrationCredentialExpiresAt, setRegistrationCredentialExpiresAt] =
    useState("");
  const { secondsLeft: otpSecondsLeft, start: startOtpCooldown } =
    useOtpCooldown();
  const {
    secondsLeft: thirdPartyOtpSecondsLeft,
    start: startThirdPartyOtpCooldown,
  } = useOtpCooldown();
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [sendOtpError, setSendOtpError] = useState<string | null>(null);
  const [thirdPartyProvider, setThirdPartyProvider] =
    useState<ThirdPartyProvider | null>(null);
  const [thirdPartyFlowId, setThirdPartyFlowId] = useState("");
  const [thirdPartyEmail, setThirdPartyEmail] = useState("");
  const [thirdPartyOtp, setThirdPartyOtp] = useState("");
  const [
    thirdPartyRegistrationCredential,
    setThirdPartyRegistrationCredential,
  ] = useState("");
  const [
    thirdPartyRegistrationCredentialExpiresAt,
    setThirdPartyRegistrationCredentialExpiresAt,
  ] = useState("");
  const [thirdPartyError, setThirdPartyError] = useState<string | null>(null);
  const [thirdPartyErrorCode, setThirdPartyErrorCode] = useState<string | null>(
    null,
  );
  const [thirdPartyMessage, setThirdPartyMessage] = useState<string | null>(
    null,
  );
  const [thirdPartyEmailError, setThirdPartyEmailError] = useState<
    string | null
  >(null);
  const [thirdPartyOtpError, setThirdPartyOtpError] = useState<string | null>(
    null,
  );
  const [isSubmittingThirdPartyAuth, setIsSubmittingThirdPartyAuth] =
    useState(false);
  const [isSendingThirdPartyOtp, setIsSendingThirdPartyOtp] = useState(false);
  const [isCompletingThirdPartyAuth, setIsCompletingThirdPartyAuth] =
    useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);

  const resetFieldErrors = useCallback(() => {
    setEmailError(null);
    setOtpError(null);
    setPasswordError(null);
    setConfirmError(null);
    setTermsError(null);
    setSendOtpError(null);
  }, []);

  const clearRegisterVerification = useCallback(() => {
    setRegisterStep("verify");
    setRegistrationCredential("");
    setRegistrationCredentialExpiresAt("");
    setPassword("");
    setConfirmPassword("");
    setAgreeTerms(false);
    setTermsError(null);
    setPasswordError(null);
    setConfirmError(null);
  }, []);

  const resetThirdPartyVerification = useCallback(() => {
    setThirdPartyFlowId("");
    setThirdPartyEmail("");
    setThirdPartyOtp("");
    setThirdPartyRegistrationCredential("");
    setThirdPartyRegistrationCredentialExpiresAt("");
    setThirdPartyEmailError(null);
    setThirdPartyOtpError(null);
    startThirdPartyOtpCooldown(0);
  }, [startThirdPartyOtpCooldown]);

  const resetThirdPartyFeedback = useCallback(() => {
    setThirdPartyError(null);
    setThirdPartyErrorCode(null);
    setThirdPartyMessage(null);
  }, []);

  const clearThirdPartyState = useCallback(() => {
    resetThirdPartyFeedback();
    resetThirdPartyVerification();
    setThirdPartyProvider(null);
  }, [resetThirdPartyFeedback, resetThirdPartyVerification]);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSendOtp = useCallback(async () => {
    resetFieldErrors();
    if (!isValidEmail(email)) {
      setEmailError("请输入有效的电子邮箱。");
      return;
    }
    if (isSendingOtp || otpSecondsLeft > 0) return;

    setIsSendingOtp(true);
    try {
      const { cooldownSeconds } = await sendEmailCode(email);
      startOtpCooldown(Math.max(1, cooldownSeconds));
      setOtpError(null);
    } catch (err) {
      if (err instanceof AuthApiError) {
        setSendOtpError(err.message);
        const raw = err.details?.cooldownSeconds;
        const cool =
          typeof raw === "number"
            ? raw
            : typeof raw === "string"
              ? Number(raw)
              : NaN;
        if (err.code === "RATE_LIMITED" && Number.isFinite(cool) && cool > 0) {
          startOtpCooldown(Math.ceil(cool));
        } else if (err.code === "RATE_LIMITED") {
          startOtpCooldown(60);
        }
      } else {
        setSendOtpError("Unexpected error. Please try again.");
      }
    } finally {
      setIsSendingOtp(false);
    }
  }, [email, isSendingOtp, otpSecondsLeft, resetFieldErrors, startOtpCooldown]);

  const handleThirdPartyAuth = useCallback(
    async (provider: ThirdPartyProvider) => {
      if (isSubmittingThirdPartyAuth || isCompletingThirdPartyAuth) return;

      resetThirdPartyFeedback();
      resetThirdPartyVerification();
      setThirdPartyProvider(provider);
      setIsSubmittingThirdPartyAuth(true);

      try {
        const result = await signInWithThirdParty(provider);
        if (result.status === "signed_in") {
          await signIn();
          return;
        }

        if (result.status === "cancelled") {
          setThirdPartyErrorCode("AUTH_CANCELLED");
          setThirdPartyError(
            getThirdPartyErrorMessage("AUTH_CANCELLED", result.message),
          );
          return;
        }

        setThirdPartyFlowId(result.flowId);
        setThirdPartyEmail(result.suggestedEmail ?? "");
        setThirdPartyMessage(result.message);
      } catch (err) {
        if (err instanceof AuthApiError) {
          setThirdPartyErrorCode(err.code);
          setThirdPartyError(getThirdPartyErrorMessage(err.code, err.message));
        } else {
          setThirdPartyErrorCode("INTERNAL_ERROR");
          setThirdPartyError("Unexpected error. Please try again.");
        }
      } finally {
        setIsSubmittingThirdPartyAuth(false);
      }
    },
    [
      isCompletingThirdPartyAuth,
      isSubmittingThirdPartyAuth,
      resetThirdPartyFeedback,
      resetThirdPartyVerification,
      signIn,
    ],
  );

  const handleSendThirdPartyOtp = useCallback(async () => {
    if (!thirdPartyFlowId) return;
    if (!isValidEmail(thirdPartyEmail)) {
      setThirdPartyEmailError("请输入有效的电子邮箱。");
      return;
    }
    if (isSendingThirdPartyOtp || thirdPartyOtpSecondsLeft > 0) return;

    setThirdPartyEmailError(null);
    setThirdPartyOtpError(null);
    setThirdPartyError(null);
    setThirdPartyErrorCode(null);
    setIsSendingThirdPartyOtp(true);

    try {
      const { cooldownSeconds } = await sendEmailCode(thirdPartyEmail);
      startThirdPartyOtpCooldown(Math.max(1, cooldownSeconds));
      setThirdPartyMessage(
        "Verification code sent. Check your inbox to continue.",
      );
    } catch (err) {
      if (err instanceof AuthApiError) {
        setThirdPartyErrorCode(err.code);
        setThirdPartyError(getThirdPartyErrorMessage(err.code, err.message));
        const raw = err.details?.cooldownSeconds;
        const cool =
          typeof raw === "number"
            ? raw
            : typeof raw === "string"
              ? Number(raw)
              : NaN;
        if (err.code === "RATE_LIMITED" && Number.isFinite(cool) && cool > 0) {
          startThirdPartyOtpCooldown(Math.ceil(cool));
        } else if (err.code === "RATE_LIMITED") {
          startThirdPartyOtpCooldown(60);
        }
      } else {
        setThirdPartyErrorCode("INTERNAL_ERROR");
        setThirdPartyError("Unexpected error. Please try again.");
      }
    } finally {
      setIsSendingThirdPartyOtp(false);
    }
  }, [
    isSendingThirdPartyOtp,
    thirdPartyEmail,
    thirdPartyFlowId,
    thirdPartyOtpSecondsLeft,
    startThirdPartyOtpCooldown,
  ]);

  const handleCompleteThirdPartyAuth = useCallback(async () => {
    if (
      !thirdPartyProvider ||
      !thirdPartyFlowId ||
      isCompletingThirdPartyAuth
    ) {
      return;
    }

    setThirdPartyEmailError(null);
    setThirdPartyOtpError(null);
    setThirdPartyError(null);

    let valid = true;
    if (!isValidEmail(thirdPartyEmail)) {
      setThirdPartyEmailError("请输入有效的电子邮箱。");
      valid = false;
    }
    if (thirdPartyOtp.trim().length !== 6) {
      setThirdPartyOtpError("验证码错误或已过期。");
      valid = false;
    }
    if (!valid) return;

    setIsCompletingThirdPartyAuth(true);
    try {
      let credential = thirdPartyRegistrationCredential;
      const expiry = thirdPartyRegistrationCredentialExpiresAt
        ? new Date(thirdPartyRegistrationCredentialExpiresAt)
        : null;

      if (
        !credential ||
        !expiry ||
        Number.isNaN(expiry.getTime()) ||
        expiry <= new Date()
      ) {
        const verifyOut = await verifyEmailCode(thirdPartyEmail, thirdPartyOtp);
        credential = verifyOut.registrationCredential;
        setThirdPartyRegistrationCredential(verifyOut.registrationCredential);
        setThirdPartyRegistrationCredentialExpiresAt(verifyOut.expiresAt);
      }

      const result = await completeThirdPartySignIn(thirdPartyProvider, {
        flowId: thirdPartyFlowId,
        email: thirdPartyEmail,
        registrationCredential: credential,
      });

      setThirdPartyMessage(
        result.isMerged
          ? `${getThirdPartyProviderLabel(thirdPartyProvider)} 账号已自动合并并登录。`
          : result.message,
      );
      resetThirdPartyVerification();
      await signIn();
    } catch (err) {
      if (err instanceof AuthApiError) {
        setThirdPartyErrorCode(err.code);
        if (err.code === "INVALID_OTP") {
          setThirdPartyRegistrationCredential("");
          setThirdPartyRegistrationCredentialExpiresAt("");
          setThirdPartyOtpError("验证码错误或已过期。");
        } else if (err.code === "ACCOUNT_LINK_CONFLICT") {
          setThirdPartyError(getThirdPartyErrorMessage(err.code, err.message));
          resetThirdPartyVerification();
          setMode("login");
          setEmail(thirdPartyEmail);
        } else {
          setThirdPartyError(getThirdPartyErrorMessage(err.code, err.message));
        }
      } else {
        setThirdPartyErrorCode("INTERNAL_ERROR");
        setThirdPartyError("Unexpected error. Please try again.");
      }
    } finally {
      setIsCompletingThirdPartyAuth(false);
    }
  }, [
    isCompletingThirdPartyAuth,
    resetThirdPartyVerification,
    signIn,
    thirdPartyEmail,
    thirdPartyFlowId,
    thirdPartyOtp,
    thirdPartyProvider,
    thirdPartyRegistrationCredential,
    thirdPartyRegistrationCredentialExpiresAt,
  ]);

  const handleSubmit = useCallback(async () => {
    resetFieldErrors();
    let ok = true;

    if (!isValidEmail(email)) {
      setEmailError("请输入有效的电子邮箱。");
      ok = false;
    }

    if (mode === "register") {
      if (registerStep === "verify") {
        if (otp.trim().length !== 6) {
          setOtpError("验证码错误或已过期。");
          ok = false;
        }
      } else {
        if (password.length < 8) {
          setPasswordError("密码至少 8 个字符。");
          ok = false;
        }
        if (password !== confirmPassword) {
          setConfirmError("两次输入的密码不一致。");
          ok = false;
        }
        if (!agreeTerms) {
          setTermsError("请阅读并同意服务条款与隐私政策。");
          ok = false;
        }
        if (!registrationCredential || !registrationCredentialExpiresAt) {
          setOtpError("验证码错误或已过期。");
          ok = false;
        } else {
          const parsedExpiry = new Date(registrationCredentialExpiresAt);
          if (
            Number.isNaN(parsedExpiry.getTime()) ||
            parsedExpiry <= new Date()
          ) {
            clearRegisterVerification();
            setOtpError("验证已过期，请重新验证邮箱。");
            ok = false;
          }
        }
      }
    } else {
      if (password.length < 1) {
        setPasswordError("请输入密码。");
        ok = false;
      }
    }

    if (!ok) return;
    if (mode === "register" && registerStep === "verify") {
      if (isVerifyingOtp) return;
      setIsVerifyingOtp(true);
      try {
        const out = await verifyEmailCode(email, otp);
        setRegistrationCredential(out.registrationCredential);
        setRegistrationCredentialExpiresAt(out.expiresAt);
        setRegisterStep("setPassword");
        setSendOtpError(null);
        setOtpError(null);
      } catch (err) {
        if (err instanceof AuthApiError) {
          setOtpError("验证码错误或已过期。");
          setSendOtpError(err.message);
        } else {
          setSendOtpError("Unexpected error. Please try again.");
        }
      } finally {
        setIsVerifyingOtp(false);
      }
      return;
    }

    if (isSubmittingAuth) return;
    setIsSubmittingAuth(true);
    try {
      if (mode === "register") {
        await registerWithEmailPassword(
          email,
          password,
          registrationCredential,
        );
      }
      await signInWithEmailPassword(email, password);
      await signIn();
      setSendOtpError(null);
    } catch (err) {
      if (err instanceof AuthApiError) {
        if (err.code === "INVALID_CREDENTIALS") {
          setPasswordError("邮箱或密码错误。");
        } else if (err.code === "CONFLICT") {
          setEmailError("该邮箱已注册，请直接登录。");
        } else if (err.code === "INVALID_OTP") {
          setOtpError("验证码错误或已过期。");
          clearRegisterVerification();
        } else {
          setSendOtpError(err.message);
        }
      } else {
        setSendOtpError("Unexpected error. Please try again.");
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  }, [
    clearRegisterVerification,
    isSubmittingAuth,
    isVerifyingOtp,
    agreeTerms,
    confirmPassword,
    email,
    mode,
    otp,
    password,
    registerStep,
    registrationCredential,
    registrationCredentialExpiresAt,
    resetFieldErrors,
    signIn,
  ]);

  const cardMaxWidth = Math.min(windowWidth - Spacing.xl * 2, 420);

  const styles = StyleSheet.create({
    bg: { flex: 1 },
    keyboard: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: Spacing.xl,
    },
    glassCard: {
      width: cardMaxWidth,
      alignSelf: "center",
      backgroundColor: "rgba(255,255,255,0.72)",
      borderRadius: 32,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xxl,
      shadowColor: "#0058bc",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: Spacing.xxl,
    },
    logoImage: {
      width: 160,
      height: 160,
      borderRadius: 40,
    },
    subhead: {
      fontSize: 17,
      lineHeight: 24,
      color: colors.onSurfaceVariant,
      marginBottom: Spacing.xxl,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    label: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.2,
      color: colors.onSurfaceVariant,
      marginBottom: Spacing.sm,
      textTransform: "uppercase",
    },
    labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: Spacing.sm,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceContainerHighest,
      borderRadius: 14,
      paddingHorizontal: Spacing.md,
      minHeight: 52,
    },
    inputWrapError: {
      borderWidth: 1,
      borderColor: "rgba(186, 26, 26, 0.25)",
    },
    inputIcon: {
      marginRight: Spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.onSurface,
      paddingVertical: Platform.OS === "ios" ? 14 : 12,
    },
    fieldGap: {
      marginBottom: Spacing.lg,
    },
    otpSend: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      color: colors.primary,
      textTransform: "uppercase",
    },
    otpSendMuted: {
      color: colors.outlineVariant,
      fontWeight: "600",
    },
    errorText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.error,
      marginTop: Spacing.xs,
    },
    successText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
      marginTop: Spacing.xs,
    },
    banner: {
      marginTop: Spacing.lg,
      borderRadius: 16,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      gap: Spacing.xs,
    },
    bannerError: {
      backgroundColor: "rgba(186, 26, 26, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(186, 26, 26, 0.18)",
    },
    bannerSuccess: {
      backgroundColor: "rgba(0, 88, 188, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(0, 88, 188, 0.16)",
    },
    bannerTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.onSurface,
    },
    bannerText: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.onSurfaceVariant,
    },
    termsRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.md,
      marginTop: Spacing.sm,
      marginBottom: Spacing.md,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainerHighest,
      marginTop: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxOn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    termsText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      color: colors.onSurfaceVariant,
    },
    link: {
      color: colors.primary,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    primaryButton: {
      marginTop: Spacing.lg,
      borderRadius: 999,
      overflow: "hidden",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
      elevation: 4,
    },
    primaryGradient: {
      paddingVertical: Spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryLabel: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.onPrimary,
    },
    switchRow: {
      marginTop: Spacing.lg,
      alignItems: "center",
    },
    switchText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    switchLink: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
    },
    dividerWrap: {
      marginTop: Spacing.xxl,
      marginBottom: Spacing.lg,
    },
    dividerLine: {
      height: 1,
      backgroundColor: "rgba(193, 198, 215, 0.35)",
    },
    dividerLabel: {
      alignSelf: "center",
      marginTop: -10,
      backgroundColor: "rgba(255,255,255,0.72)",
      paddingHorizontal: Spacing.md,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      color: colors.outline,
      textTransform: "uppercase",
    },
    socialRow: {
      flexDirection: "row",
      gap: Spacing.md,
    },
    socialBtn: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.45)",
      borderRadius: 14,
      paddingVertical: Spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    socialBtnDisabled: {
      opacity: 0.55,
    },
    socialIcon: {
      height: 22,
      width: 22,
      resizeMode: "contain",
    },
    socialBtnLabel: {
      marginTop: Spacing.sm,
      fontSize: 11,
      fontWeight: "700",
      color: colors.onSurfaceVariant,
    },
    supplementalCard: {
      marginTop: Spacing.lg,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.52)",
      padding: Spacing.lg,
    },
    supplementalTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.onSurface,
      marginBottom: Spacing.xs,
    },
    supplementalText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.onSurfaceVariant,
      marginBottom: Spacing.md,
    },
    socialActionsRow: {
      flexDirection: "row",
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    secondaryButton: {
      flex: 1,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      paddingVertical: Spacing.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.36)",
    },
    secondaryButtonLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.onSurface,
    },
  });

  return (
    <ImageBackground
      source={{ uri: HERO_BACKGROUND_URI }}
      style={styles.bg}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.glassCard}>
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logoImage}
              />
            </View>

            <View style={styles.fieldGap}>
              <Text style={styles.label}>电子邮箱</Text>
              <View
                style={[
                  styles.inputWrap,
                  emailError ? styles.inputWrapError : null,
                ]}
              >
                <MaterialIcons
                  style={styles.inputIcon}
                  name="mail-outline"
                  size={22}
                  color={colors.onSurfaceVariant}
                />
                <TextInput
                  testID="auth-email"
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor={`${colors.outline}99`}
                  value={email}
                  onChangeText={(t) => {
                    if (mode === "register" && registerStep === "setPassword") {
                      clearRegisterVerification();
                    }
                    setEmail(t);
                    if (emailError) setEmailError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {mode === "register" ? (
              <View style={styles.fieldGap}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>邮箱验证码</Text>
                  <TouchableOpacity
                    onPress={() => void handleSendOtp()}
                    disabled={isSendingOtp || otpSecondsLeft > 0}
                    accessibilityRole="button"
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {isSendingOtp ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                          style={{ marginRight: 6 }}
                        />
                      ) : null}
                      <Text
                        style={[
                          styles.otpSend,
                          (isSendingOtp || otpSecondsLeft > 0) && {
                            opacity: 0.5,
                          },
                        ]}
                      >
                        发送验证码
                        {otpSecondsLeft > 0 ? (
                          <Text style={styles.otpSendMuted}>
                            {" "}
                            ({otpSecondsLeft}s)
                          </Text>
                        ) : null}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.inputWrap,
                    otpError ? styles.inputWrapError : null,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="请输入6位验证码"
                    placeholderTextColor={`${colors.outline}99`}
                    value={otp}
                    onChangeText={(t) => {
                      if (registerStep === "setPassword") {
                        clearRegisterVerification();
                      }
                      setOtp(t.replace(/\D/g, "").slice(0, 6));
                      if (otpError) setOtpError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={registerStep === "verify"}
                  />
                  {otpError ? (
                    <MaterialIcons
                      name="error-outline"
                      size={22}
                      color={colors.error}
                    />
                  ) : null}
                </View>
                {otpError ? (
                  <Text style={styles.errorText}>{otpError}</Text>
                ) : null}
                {sendOtpError ? (
                  <Text style={styles.errorText}>{sendOtpError}</Text>
                ) : null}
                {registerStep === "setPassword" ? (
                  <Text style={styles.successText}>
                    验证成功，请设置账户密码。
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View
              style={[
                styles.fieldGap,
                mode === "register" && registerStep === "verify"
                  ? { display: "none" }
                  : null,
              ]}
            >
              <Text style={styles.label}>密码</Text>
              <View
                style={[
                  styles.inputWrap,
                  passwordError ? styles.inputWrapError : null,
                ]}
              >
                <TextInput
                  testID="auth-password"
                  style={styles.input}
                  placeholder={
                    mode === "register" ? "至少8个字符" : "请输入密码"
                  }
                  placeholderTextColor={`${colors.outline}99`}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (passwordError) setPasswordError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete={
                    mode === "register" ? "password-new" : "password"
                  }
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((s) => !s)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "隐藏密码" : "显示密码"}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={22}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            {mode === "register" && registerStep === "setPassword" ? (
              <View style={styles.fieldGap}>
                <Text style={styles.label}>确认密码</Text>
                <View
                  style={[
                    styles.inputWrap,
                    confirmError ? styles.inputWrapError : null,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="请再次输入密码"
                    placeholderTextColor={`${colors.outline}99`}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      if (confirmError) setConfirmError(null);
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="password-new"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((s) => !s)}
                    accessibilityRole="button"
                  >
                    <MaterialIcons
                      name={
                        showConfirmPassword ? "visibility-off" : "visibility"
                      }
                      size={22}
                      color={colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
                {confirmError ? (
                  <Text style={styles.errorText}>{confirmError}</Text>
                ) : null}
              </View>
            ) : null}

            {mode === "register" && registerStep === "setPassword" ? (
              <>
                <Pressable
                  style={styles.termsRow}
                  onPress={() => {
                    setAgreeTerms((a) => !a);
                    if (termsError) setTermsError(null);
                  }}
                >
                  <View
                    style={[styles.checkbox, agreeTerms && styles.checkboxOn]}
                  >
                    {agreeTerms ? (
                      <MaterialIcons
                        name="check"
                        size={16}
                        color={colors.onPrimary}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.termsText}>
                    我同意
                    <Text style={styles.link}> 服务条款 </Text>和
                    <Text style={styles.link}> 隐私政策</Text>。
                  </Text>
                </Pressable>
                {termsError ? (
                  <Text style={styles.errorText}>{termsError}</Text>
                ) : null}
              </>
            ) : null}

            <TouchableOpacity
              testID="auth-submit"
              style={styles.primaryButton}
              onPress={handleSubmit}
              disabled={isVerifyingOtp || isSubmittingAuth}
              activeOpacity={0.92}
            >
              <LinearGradient
                colors={["#0058bc", "#0070eb"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryLabel}>
                  {mode === "register"
                    ? registerStep === "verify"
                      ? isVerifyingOtp
                        ? "验证中..."
                        : "验证验证码"
                      : isSubmittingAuth
                        ? "提交中..."
                        : "创建账户"
                    : isSubmittingAuth
                      ? "登录中..."
                      : "登录"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.switchRow}>
              {mode === "register" ? (
                <Pressable
                  testID="auth-switch-to-login"
                  onPress={() => {
                    resetFieldErrors();
                    setMode("login");
                    setOtp("");
                    clearRegisterVerification();
                    clearThirdPartyState();
                    setConfirmPassword("");
                    setAgreeTerms(false);
                    startOtpCooldown(0);
                  }}
                >
                  <Text style={styles.switchText}>
                    已有账号？
                    <Text style={styles.switchLink}> 在此登录</Text>
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    resetFieldErrors();
                    setMode("register");
                    setRegisterStep("verify");
                    clearThirdPartyState();
                  }}
                >
                  <Text style={styles.switchText}>
                    还没有账号？
                    <Text style={styles.switchLink}> 注册新账号</Text>
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={styles.dividerWrap}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>或通过以下方式继续</Text>
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                testID="auth-social-apple"
                style={[
                  styles.socialBtn,
                  (isSubmittingThirdPartyAuth || isCompletingThirdPartyAuth) &&
                    styles.socialBtnDisabled,
                ]}
                accessibilityLabel="使用 Apple 继续"
                onPress={() => void handleThirdPartyAuth("apple")}
                disabled={
                  isSubmittingThirdPartyAuth || isCompletingThirdPartyAuth
                }
              >
                {isSubmittingThirdPartyAuth &&
                thirdPartyProvider === "apple" ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Image
                      source={{ uri: SOCIAL_APPLE_URI }}
                      style={styles.socialIcon}
                    />
                    <Text style={styles.socialBtnLabel}>Apple</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                testID="auth-social-google"
                style={[
                  styles.socialBtn,
                  (isSubmittingThirdPartyAuth || isCompletingThirdPartyAuth) &&
                    styles.socialBtnDisabled,
                ]}
                accessibilityLabel="使用 Google 继续"
                onPress={() => void handleThirdPartyAuth("google")}
                disabled={
                  isSubmittingThirdPartyAuth || isCompletingThirdPartyAuth
                }
              >
                {isSubmittingThirdPartyAuth &&
                thirdPartyProvider === "google" ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Image
                      source={{ uri: SOCIAL_GOOGLE_URI }}
                      style={styles.socialIcon}
                    />
                    <Text style={styles.socialBtnLabel}>Google</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                testID="auth-social-wechat"
                style={[
                  styles.socialBtn,
                  (isSubmittingThirdPartyAuth || isCompletingThirdPartyAuth) &&
                    styles.socialBtnDisabled,
                ]}
                accessibilityLabel="使用微信继续"
                onPress={() => void handleThirdPartyAuth("wechat")}
                disabled={
                  isSubmittingThirdPartyAuth || isCompletingThirdPartyAuth
                }
              >
                {isSubmittingThirdPartyAuth &&
                thirdPartyProvider === "wechat" ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <MaterialIcons
                      name="chat"
                      size={24}
                      color={colors.onSurfaceVariant}
                    />
                    <Text style={styles.socialBtnLabel}>微信</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {thirdPartyError ? (
              <View
                testID="auth-third-party-error"
                style={[styles.banner, styles.bannerError]}
              >
                <Text style={styles.bannerTitle}>第三方登录未完成</Text>
                <Text style={styles.bannerText}>{thirdPartyError}</Text>
              </View>
            ) : null}

            {thirdPartyMessage ? (
              <View
                testID="auth-third-party-message"
                style={[styles.banner, styles.bannerSuccess]}
              >
                <Text style={styles.bannerTitle}>第三方登录</Text>
                <Text style={styles.bannerText}>{thirdPartyMessage}</Text>
              </View>
            ) : null}

            {thirdPartyFlowId && thirdPartyProvider ? (
              <View style={styles.supplementalCard}>
                <Text style={styles.supplementalTitle}>
                  补充 {getThirdPartyProviderLabel(thirdPartyProvider)} 登录邮箱
                </Text>
                <Text style={styles.supplementalText}>
                  第三方授权未返回可用邮箱。请补充邮箱并完成验证码校验后继续登录。
                </Text>

                <View style={styles.fieldGap}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>补充邮箱</Text>
                  </View>
                  <View
                    style={[
                      styles.inputWrap,
                      thirdPartyEmailError ? styles.inputWrapError : null,
                    ]}
                  >
                    <MaterialIcons
                      style={styles.inputIcon}
                      name="mail-outline"
                      size={22}
                      color={colors.onSurfaceVariant}
                    />
                    <TextInput
                      testID="auth-third-party-email"
                      style={styles.input}
                      placeholder="example@email.com"
                      placeholderTextColor={`${colors.outline}99`}
                      value={thirdPartyEmail}
                      onChangeText={(value) => {
                        setThirdPartyEmail(value);
                        setThirdPartyRegistrationCredential("");
                        setThirdPartyRegistrationCredentialExpiresAt("");
                        if (thirdPartyEmailError) setThirdPartyEmailError(null);
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>
                  {thirdPartyEmailError ? (
                    <Text style={styles.errorText}>{thirdPartyEmailError}</Text>
                  ) : null}
                </View>

                <View style={styles.fieldGap}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>邮箱验证码</Text>
                    <TouchableOpacity
                      testID="auth-third-party-send-otp"
                      onPress={() => void handleSendThirdPartyOtp()}
                      disabled={
                        isSendingThirdPartyOtp || thirdPartyOtpSecondsLeft > 0
                      }
                      accessibilityRole="button"
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        {isSendingThirdPartyOtp ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                            style={{ marginRight: 6 }}
                          />
                        ) : null}
                        <Text
                          style={[
                            styles.otpSend,
                            (isSendingThirdPartyOtp ||
                              thirdPartyOtpSecondsLeft > 0) && {
                              opacity: 0.5,
                            },
                          ]}
                        >
                          发送验证码
                          {thirdPartyOtpSecondsLeft > 0 ? (
                            <Text style={styles.otpSendMuted}>
                              {" "}
                              ({thirdPartyOtpSecondsLeft}s)
                            </Text>
                          ) : null}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={[
                      styles.inputWrap,
                      thirdPartyOtpError ? styles.inputWrapError : null,
                    ]}
                  >
                    <TextInput
                      testID="auth-third-party-otp"
                      style={styles.input}
                      placeholder="请输入6位验证码"
                      placeholderTextColor={`${colors.outline}99`}
                      value={thirdPartyOtp}
                      onChangeText={(value) => {
                        setThirdPartyOtp(value.replace(/\D/g, "").slice(0, 6));
                        if (thirdPartyOtpError) setThirdPartyOtpError(null);
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                  {thirdPartyOtpError ? (
                    <Text style={styles.errorText}>{thirdPartyOtpError}</Text>
                  ) : null}
                </View>

                <View style={styles.socialActionsRow}>
                  <TouchableOpacity
                    testID="auth-third-party-cancel"
                    style={styles.secondaryButton}
                    onPress={clearThirdPartyState}
                    disabled={isCompletingThirdPartyAuth}
                  >
                    <Text style={styles.secondaryButtonLabel}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="auth-third-party-complete"
                    style={styles.primaryButton}
                    onPress={() => void handleCompleteThirdPartyAuth()}
                    disabled={isCompletingThirdPartyAuth}
                    activeOpacity={0.92}
                  >
                    <LinearGradient
                      colors={["#0058bc", "#0070eb"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.primaryGradient}
                    >
                      <Text style={styles.primaryLabel}>
                        {isCompletingThirdPartyAuth
                          ? "提交中..."
                          : "验证邮箱并登录"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {thirdPartyError && thirdPartyProvider ? (
              <View style={styles.socialActionsRow}>
                {thirdPartyErrorCode === "ACCOUNT_LINK_CONFLICT" ? (
                  <TouchableOpacity
                    testID="auth-third-party-use-email"
                    style={styles.secondaryButton}
                    onPress={() => {
                      setMode("login");
                      if (thirdPartyEmail) {
                        setEmail(thirdPartyEmail);
                      }
                    }}
                    disabled={
                      isSubmittingThirdPartyAuth || isCompletingThirdPartyAuth
                    }
                  >
                    <Text style={styles.secondaryButtonLabel}>
                      使用邮箱登录
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    testID="auth-third-party-retry"
                    style={styles.secondaryButton}
                    onPress={() =>
                      void handleThirdPartyAuth(thirdPartyProvider)
                    }
                    disabled={
                      isSubmittingThirdPartyAuth || isCompletingThirdPartyAuth
                    }
                  >
                    <Text style={styles.secondaryButtonLabel}>
                      重试 {getThirdPartyProviderLabel(thirdPartyProvider)} 登录
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
