export default function Slider() {
    return (
        <div id="homeHero" className="carousel slide mb-4" data-bs-ride="carousel">
            <div className="carousel-indicators">
                <button type="button" data-bs-target="#homeHero" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
                <button type="button" data-bs-target="#homeHero" data-bs-slide-to="1" aria-label="Slide 2"></button>
                <button type="button" data-bs-target="#homeHero" data-bs-slide-to="2" aria-label="Slide 3"></button>
            </div>
            <div className="carousel-inner rounded-3 overflow-hidden">
                <div className="carousel-item active">
                    <img src="https://cotton4u.vn/files/news/2025/08/25/982d0d521f6d52fefac09d7012bf7109.webp" className="d-block w-100" alt="Bộ sưu tập mùa mới" />
                </div>
                <div className="carousel-item">
                    <img src="https://cotton4u.vn/files/news/2025/07/05/a74138038a7c1cb247d160891f352e69.webp" className="d-block w-100" alt="Ưu đãi đặc biệt" />
                </div>
            </div>
            <button className="carousel-control-prev" type="button" data-bs-target="#homeHero" data-bs-slide="prev">
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Previous</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#homeHero" data-bs-slide="next">
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Next</span>
            </button>
        </div>
    )
}


