import NavHeader from './components/NavHeader';
import GameCards from './components/GameCards';
import InfoBox from './components/InfoBox';
function App(): React.JSX.Element {  
  return (
    <>
      <NavHeader />
      <div className='w-full relative'>
        <div className='absolute top-0 right-20 z-50 flex flex-col items-center'>
          <InfoBox />
        </div>
        <GameCards/>       
      </div>      
    </>
  );
}
export default App;
