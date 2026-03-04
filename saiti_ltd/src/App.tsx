import Hero_page from './Hero_page/Hero_page'
import Login from './Login_page/Login';
import Signup from './Signup_Page/Signup';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Hero_page/>}/>
            <Route path='/login' element={<Login/>}/>
            <Route path='/signup' element={<Signup/>}/>
        </Routes>
    </BrowserRouter>
  );
}

export default App