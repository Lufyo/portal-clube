import Footer from "../components/Footer";
import Header from "../components/Header";
import Hero from "../components/Hero";
import JogosSection from "../components/JogosSection";
import NoticiasSection from "../components/NoticiasSection";
import PatrocinadoresSection from "../components/PatrocinadoresSection";
import PlanosSection from "../components/PlanosSection";

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo">
        <Hero />
        <PlanosSection />
        <JogosSection />
        <NoticiasSection />
        <PatrocinadoresSection />
      </main>
      <Footer />
    </>
  );
}