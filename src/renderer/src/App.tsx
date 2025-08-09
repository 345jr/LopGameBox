import NavHeader from './components/NavHeader';
import GameCards from './components/GameCards';

function App(): React.JSX.Element {  
  return (
    <>
      <NavHeader />
      <div className='w-full'>
        <GameCards/>
      </div>
      
    </>
  );
}
export default App;
