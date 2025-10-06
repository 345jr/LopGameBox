import NavHeader from './components/NavHeader';
import GameCards from './components/GameCards';
import InfoBox from './components/InfoBox';
function App(): React.JSX.Element {
  return (
    <>
      <NavHeader />
      <div className="relative w-full">
        {/* <div className="absolute top-0 right-20 z-50 flex flex-col items-center">
          <InfoBox />
        </div> */}
        <div className="">
          <GameCards />
        </div>
      </div>
    </>
  );
}
export default App;
