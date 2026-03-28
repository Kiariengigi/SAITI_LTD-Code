import { Container, Row, Col } from "react-bootstrap";
import Navbar_comp from "../Hero_page/navbar";
import Signup_form from "./Signup_form";
import Signup_Animation from "./Signup_Animation";

function Signup() {
    return (
        <div className="login-page-wrapper vh-100 overflow-hidden">
            {/* 1. Navbar needs to be absolute or fixed to not push the grid down */}
            <div className="position-absolute top-0 w-100 z-3">
                <Navbar_comp />
            </div>

            {/* 2. Single Fluid Container with p-0 and g-0 is the secret */}
            <Container fluid className="p-0 vh-100 bg-white">
                <Row className="g-0 h-100">
    {/* Removed ms-4 to ensure perfect centering on mobile */}
    <Col 
        xs={12} 
        md={5} 
        className="d-flex flex-column align-items-center justify-content-center px-4 px-md-5 text-center"
    >
        <Signup_form />
    </Col>
    
    <Col md={7} className="d-none d-md-block h-100 p-0">
        <Signup_Animation />
    </Col>
</Row>
            </Container>
        </div>
    );
}

export default Signup;