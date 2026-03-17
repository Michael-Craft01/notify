import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface WelcomeNudgeEmailProps {
  firstName: string;
}

export const WelcomeNudgeEmail = ({
  firstName,
}: WelcomeNudgeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Notify, {firstName}! 🧡</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
           <Heading style={logoText}>NOTIFY</Heading>
        </Section>
        <Heading style={h1}>Welcome aboard, {firstName}.</Heading>
        <Text style={text}>
          You're now part of the **Computer Science 2028** alert system. We're here to make sure you never miss a lecture, a break, or a deadline.
        </Text>
        <Section style={card}>
          <Heading style={h2}>🚨 Action Required: Enable Alerts</Heading>
          <Text style={textSmall}>
            Our "Warden" logic works best when push notifications are active. It gives you a 10-minute heads-up before classes and instant updates if a lecture is cancelled.
          </Text>
          <Link
            href="https://notify.logichq.tech"
            style={button}
          >
            Enable My Alerts
          </Link>
        </Section>
        <Text style={footer}>
          &copy; {new Date().getFullYear()} Notify Dashboard. Optimized for CS 2028.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeNudgeEmail;

const main = {
  backgroundColor: "#060606",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const logoSection = {
  marginBottom: "32px",
};

const logoText = {
  color: "#F97316",
  fontSize: "24px",
  fontWeight: "900",
  letterSpacing: "0.1em",
  margin: "0",
};

const h1 = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "800",
  lineHeight: "1.2",
  margin: "0 0 20px",
};

const h2 = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 10px",
};

const text = {
  color: "rgba(255, 255, 255, 0.7)",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const textSmall = {
  color: "rgba(255, 255, 255, 0.5)",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 24px",
};

const card = {
  padding: "32px",
  backgroundColor: "rgba(255, 255, 255, 0.03)",
  borderRadius: "24px",
  border: "1px solid rgba(249, 115, 22, 0.2)",
};

const button = {
  backgroundColor: "#F97316",
  borderRadius: "12px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px",
};

const footer = {
  color: "rgba(255, 255, 255, 0.3)",
  fontSize: "12px",
  marginTop: "40px",
  textAlign: "center" as const,
};
