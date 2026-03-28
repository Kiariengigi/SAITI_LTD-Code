import '../Styles/navbar.css'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import { useLocation, useNavigate, Link } from 'react-router-dom'


function Navbar_comp() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleAction = () => {
    if (location.pathname === '/login'){
      navigate('/signup')
      return 'Sign Up'
    } else{
      navigate('/login')
      return 'Log in'
    }
  }

  return (
    <Navbar className="nav_bar" fixed="top">
      <Container fluid className="d-flex justify-content-between align-items-center px-3 px-md-5 mt-5">
        
        {/* Logo scales with clamp() in CSS */}
        <Navbar.Brand as={Link} to="/" className="m-0">
          <h1 className="logo-text">
            <span className="fw-bold">SAITI</span>_LTD
          </h1>
        </Navbar.Brand>

        {/* Action Button scales with padding/font classes */}
        
        <Button onClick={handleAction} className="nav-btn rounded-pill btn-dark border-0 px-4">
          {handleAction()}
        </Button>

      </Container>
    </Navbar>
  )
}

export default Navbar_comp
