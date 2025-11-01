import Footer from "@/components/site/footer";
import Hero from "@/components/site/hero";
import Navbar from "@/components/site/navbar";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
      </main>
      <Footer />
    </div>
  );
}

export default App;
