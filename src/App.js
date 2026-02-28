import './App.css';
import BestRest from './Components/BestRest';
import Footer from './Components/Footer';
import Navigate from './Components/Navigate';
import OffersBanner from './Components/OffersBanner';
import RestaurentChain from './Components/RestaurentChain';
import RestaurentOnline from './Components/RestaurentOnline';

function App() {
  return (
    <div>

      {/* ✅ Version Banner */}
      <div style={{
        backgroundColor: "black",
        color: "white",
        textAlign: "center",
        padding: "10px",
        fontWeight: "bold"
      }}>
        Swiggy Clone - {process.env.REACT_APP_VERSION}
      </div>

      <Navigate/>
      <OffersBanner/>
      <RestaurentChain/>
      <RestaurentOnline/>
      <BestRest/>
      <Footer/>
    </div>
  );
}

export default App;
