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
  Hr,
  Img,
} from "@react-email/components";
import * as React from "react";

interface NotificationEmailProps {
  firstName: string;
  subject: string;
  type: 'warden' | 'briefing' | 'assignment';
  moduleName?: string;
  venue?: string;
  time?: string;
  alertType?: 'upcoming' | 'started';
  briefingType?: 'morning' | 'evening';
  classCount?: number;
  deadline?: { title: string; days: string };
  cohortPct?: number;
  bodyText?: string;
}

export const NotificationEmail = ({
  firstName,
  subject,
  type,
  moduleName,
  venue,
  time,
  alertType,
  briefingType,
  classCount,
  deadline,
  cohortPct,
  bodyText,
}: NotificationEmailProps) => {
  const isMorning = briefingType === 'morning';
  const isEvening = briefingType === 'evening';

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Heading style={logoText}>NOTIFY</Heading>
          </Section>

          <Heading style={h1}>Hey {firstName},</Heading>
          
          <Section style={card}>
            {type === 'warden' && (
              <>
                <Text style={badge}>
                  {alertType === 'started' ? '🚨 LIVE NOW' : '🚶‍♂️ UPCOMING'}
                </Text>
                <Heading style={h2}>{moduleName}</Heading>
                <Text style={text}>
                  {alertType === 'started'
                    ? `Class has already begun at ${venue || 'your designated hall'}. Hope you're already there!`
                    : `Your lecture starts in 10 minutes at ${venue || 'the hall'}. Grab your bags and let's go.`}
                </Text>
              </>
            )}

            {type === 'briefing' && (
              <>
                <Text style={badge}>
                  {isMorning ? '☀️ MORNING HYPE' : '🌙 EVENING BRIEF'}
                </Text>
                <Heading style={h2}>
                  {isMorning ? "Today's Gameplan" : "Day Done. Tomorrow's Plan."}
                </Heading>
                <Text style={text}>
                  {isMorning
                    ? classCount && classCount > 0
                      ? `You have ${classCount} sessions today. First up is ${moduleName} at ${time}.`
                      : "Zero classes on the radar today! Enjoy the breather or tackle your own goals."
                    : classCount && classCount > 0
                    ? `You've got ${classCount} classes tomorrow. Get some rest so you're ready to crush it!`
                    : "No classes tomorrow. Perfect time to catch up on assignments or relax."}
                </Text>
                {deadline && (
                  <>
                    <Hr style={hr} />
                    <Text style={textSmall}>
                      🎯 <strong>Deadline Looming:</strong> {deadline.title} is due in {deadline.days}.
                    </Text>
                  </>
                )}
              </>
            )}

            {type === 'assignment' && (
              <>
                <Text style={badge}>⏳ DEADLINE NUDGE</Text>
                <Heading style={h2}>{moduleName}</Heading>
                <Text style={text}>
                  {bodyText}
                  {cohortPct && cohortPct > 0 ? ` Note: ${cohortPct}% of the cohort has already finished this.` : ''}
                </Text>
              </>
            )}

            <Link href="https://notify.logichq.tech" style={button}>
              Open Dashboard
            </Link>
          </Section>

          <Text style={footer}>
            &copy; {new Date().getFullYear()} Notify Dashboard. Optimized for Computer Science 2028.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default NotificationEmail;

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
  fontSize: "28px",
  fontWeight: "800",
  lineHeight: "1.2",
  margin: "0 0 24px",
};

const h2 = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "800",
  margin: "0 0 12px",
  letterSpacing: "-0.02em",
};

const badge = {
  color: "#F97316",
  fontSize: "11px",
  fontWeight: "900",
  letterSpacing: "0.2em",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
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
  margin: "16px 0",
};

const card = {
  padding: "36px",
  backgroundColor: "rgba(255, 255, 255, 0.03)",
  borderRadius: "32px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
};

const button = {
  backgroundColor: "#F97316",
  borderRadius: "14px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "800",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px",
  marginTop: "8px",
};

const hr = {
  borderColor: "rgba(255, 255, 255, 0.08)",
  margin: "24px 0",
};

const footer = {
  color: "rgba(255, 255, 255, 0.3)",
  fontSize: "12px",
  marginTop: "40px",
  textAlign: "center" as const,
};
