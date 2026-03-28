import login_vid from '../assets/Login_Signup/Seamless_Video_Loop_Rquest.mp4'
import '../Styles/Login_Animation.css'

function Login_Animation(){
    return(
    <div className="video-wrapper">
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        poster="../assets/video-fallback.jpg" 
        className="background-video"
      >
        <source src={login_vid} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      </div>
    )
}

export default Login_Animation