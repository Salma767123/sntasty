import { getSettings } from "@/lib/data";
import AboutPublicClient from "./AboutPublicClient";

export const metadata = {
  title: "About Us | Sai Nandhini",
  description: "Learn about the heritage, philosophy, and culinary journey of Sai Nandhini.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await getSettings();
  
  return <AboutPublicClient initialAboutUs={settings.aboutUs} />;
}
