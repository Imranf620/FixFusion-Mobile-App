
export const api = async (endpoint, method = 'GET', data = null, token = null , contentType="application/json" ) => {

    const isFormData = data instanceof FormData;


  const config = {
    method,
    headers: {
        ...(!isFormData && { 'Content-Type': contentType }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(data && { body: isFormData ? data : JSON.stringify(data) }), 
  };

  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${endpoint}`, config);
    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(responseData.message || 'Something went wrong');
    }

    return responseData;
  } catch (error) {
    console.log('error',error)
    throw error;
  }
};
