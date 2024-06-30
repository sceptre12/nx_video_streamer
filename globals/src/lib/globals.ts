


export const resolveJson = async <T>(promise: Promise<Response> ): Promise<T | undefined> =>{
  try {
    const response = await promise;
    if(response.ok){
      return await response.json()
    }
  } catch (err) {
    console.error(err);
  }
  return;
}