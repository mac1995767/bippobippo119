import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import HospitalReview from '../../components/HospitalReview';
import { useAuth } from '../../contexts/AuthContext';
import { fetchNursingHospitalDetail } from '../../service/api';

const NursingHospitalReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        setLoading(true);
        const response = await fetchNursingHospitalDetail(id);
        
        if (response) {
          setHospital(response);
        } else {
          throw new Error('병원 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('Error fetching hospital:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHospital();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          <p>오류가 발생했습니다: {error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>병원을 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/nursing-hospitals')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/nursing-hospitals/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft className="mr-2" />
          병원 상세 정보로 돌아가기
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{hospital.yadmNm || '병원 이름 없음'}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <HospitalReview hospitalId={id} hospitalType="nursing" />
      </div>
    </div>
  );
};

export default NursingHospitalReviewPage; 