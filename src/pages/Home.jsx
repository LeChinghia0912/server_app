import Slider from "../components/Slider";
import "../styles/home.scss";
import ListProduct from "../components/list-product";

export default function Home() {
  return (
    <div>
      <Slider />
      <div className="title-section">
        MỪNG QUỐC KHÁNH – IVY MODA SALE UP TO 50%
      </div>

      <div className="products-section">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="products-section-title">Sản phẩm mới</div>
            </div>
            <ListProduct /> 
          </div>
        </div>
      </div>
    </div>
  );
}
